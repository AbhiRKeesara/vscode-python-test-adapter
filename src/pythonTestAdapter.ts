import { Event, EventEmitter, WorkspaceFolder } from 'vscode';
import {
    TestAdapter,
    TestEvent,
    TestInfo,
    TestLoadFinishedEvent,
    TestLoadStartedEvent,
    TestRunFinishedEvent,
    TestRunStartedEvent,
    TestSuiteEvent,
    TestSuiteInfo
} from 'vscode-test-adapter-api';

import { ConfigurationFactory } from './configurationFactory';
import { ILogger } from './logging/logger';
import { ITestRunner } from './testRunner';

export class PythonTestAdapter implements TestAdapter {

    get tests(): Event<TestLoadStartedEvent | TestLoadFinishedEvent> { return this.testsEmitter.event; }

    get testStates(): Event<TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent> {
        return this.testStatesEmitter.event;
    }

    get autorun(): Event<void> {
        return this.autorunEmitter.event;
    }

    private disposables: Array<{ dispose(): void }> = [];
    private readonly testsEmitter = new EventEmitter<TestLoadStartedEvent | TestLoadFinishedEvent>();
    private readonly testStatesEmitter = new EventEmitter<
        TestRunStartedEvent | TestRunFinishedEvent | TestSuiteEvent | TestEvent>();
    private readonly autorunEmitter = new EventEmitter<void>();

    private readonly testsById = new Map<string, TestSuiteInfo | TestInfo>();

    constructor(
        public readonly workspaceFolder: WorkspaceFolder,
        private readonly testRunner: ITestRunner,
        private readonly logger: ILogger
    ) {
        this.disposables = [
            this.testsEmitter,
            this.testStatesEmitter,
            this.autorunEmitter
        ];
    }

    public async load(): Promise<void> {
        try {
            this.testsEmitter.fire({ type: 'started' });

            this.testsById.clear();
            const config = ConfigurationFactory.get(this.workspaceFolder);
            const tests = await this.testRunner.load(config);
            this.saveToMap(tests);

            this.testsEmitter.fire({ type: 'finished', suite: tests });
        } catch (error) {
            this.logger.log('crit', `Test loading failed: ${error}`);
            this.testsEmitter.fire({ type: 'finished', suite: undefined, errorMessage: error.stack });
        }
    }

    public async run(tests: string[]): Promise<void> {
        try {
            this.testStatesEmitter.fire({ type: 'started', tests });
            const config = ConfigurationFactory.get(this.workspaceFolder);
            const testRuns = tests.map(test => {
                return this.testRunner.run(config, test)
                    .then(states => states.forEach(state => this.testStatesEmitter.fire(state)))
                    .catch(reason => {
                        this.logger.log('crit', `Execution of the test "${test}" failed: ${reason}`);
                        this.setTestStatesRecursive(test, 'failed', reason);
                    });
            });
            await Promise.all(testRuns);
        } finally {
            this.testStatesEmitter.fire({ type: 'finished' });
        }
    }

    public debug(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public cancel(): void {
        throw new Error('Method not implemented.');
    }

    public dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }

    private saveToMap(test: TestSuiteInfo | TestInfo | undefined) {
        if (!test) {
            return;
        }
        this.testsById.set(test.id, test);
        if (test.type === 'suite') {
            test.children.forEach(child => this.saveToMap(child));
        }
    }

    private setTestStatesRecursive(
        test: string,
        state: 'running' | 'passed' | 'failed' | 'skipped',
        message?: string | undefined
    ) {
        const info = this.testsById.get(test);
        if (!info) {
            this.logger.log('warn', `Test information for "${test}" not found`);
            return;
        }
        if (info.type === 'suite') {
            info.children.forEach(child =>
                this.setTestStatesRecursive(child.id, state, message)
            );
        } else {
            this.testStatesEmitter.fire(<TestEvent>{
                type: 'test',
                test: info.id,
                state,
                message,
            });
        }
    }
}
