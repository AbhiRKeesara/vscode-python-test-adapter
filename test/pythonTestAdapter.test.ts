import { expect } from 'chai';
import 'mocha';
import { TestEvent, TestLoadFinishedEvent, TestSuiteInfo } from 'vscode-test-adapter-api';

import { ConfigurationFactory } from '../src/configurationFactory';
import { PytestTestRunner } from '../src/pytestTestRunner';
import { PythonTestAdapter } from '../src/pythonTestAdapter';
import { UnittestTestRunner } from '../src/unittestTestRunner';
import { extractExpectedState, findTestSuiteByLabel, findWorkspaceFolder, logger } from './helpers';

[
    {
        label: 'unittest',
        runner: new UnittestTestRunner('first-id', logger()),
        testsToRun: [
            'test_two_plus_one_is_three_passed',
            'test_two_plus_two_is_five_failed',
            'test_two_plus_zero_is_two_skipped'
        ],
        suiteToSort: {
            suite: 'AddTests',
            sortedTests: [
                'test_two_plus_one_is_three_passed',
                'test_two_plus_two_is_five_failed',
                'test_two_plus_zero_is_two_skipped'
            ],
        },
    },
    {
        label: 'pytest',
        runner: new PytestTestRunner('second-id', logger()),
        testsToRun: [
            'test_one_plus_two_is_three_passed',
            'test_two_plus_two_is_five_failed',
            'test_capitalize_passed'
        ],
        suiteToSort: {
            suite: 'TestSampleWithScenarios',
            sortedTests: [
                'test_demo1_passed[advanced]',
                'test_demo1_passed[basic]',
                'test_demo10_passed[advanced]',
                'test_demo10_passed[basic]'
            ],
        },
    }
].forEach(({ label, runner, testsToRun, suiteToSort }) => {
    suite.skip(`Adapter events with ${label} runner`, () => {
        const workspaceFolder = findWorkspaceFolder(label)!;

        test('discovery events should be successfully fired', async () => {
            const adapter = new PythonTestAdapter(workspaceFolder, runner, logger());
            let startedNotifications = 0;
            let finishedNotifications = 0;
            let finishedEvent: TestLoadFinishedEvent | undefined;
            adapter.tests(event => {
                if (event.type === 'started') {
                    startedNotifications++;
                } else {
                    finishedNotifications++;
                    finishedEvent = event;
                }
            });
            await adapter.load();

            expect(startedNotifications).to.be.eq(1);
            expect(startedNotifications).to.be.eq(finishedNotifications);

            expect(finishedEvent!.errorMessage).to.be.undefined;
            expect(finishedEvent!.suite).to.be.not.undefined;
            expect(finishedEvent!.suite!.children).to.be.not.empty;
        });

        test(`test execution events should be successfully fired for ${label}`, async () => {
            const adapter = new PythonTestAdapter(workspaceFolder, runner, logger());
            const configuration = ConfigurationFactory.get(workspaceFolder, logger());
            const mainSuite = await runner.load(configuration);
            expect(mainSuite).to.be.not.undefined;
            const suites = testsToRun.map(t => findTestSuiteByLabel(mainSuite!, t)!);

            let startedNotifications = 0;
            let finishedNotifications = 0;
            const states: TestEvent[] = [];
            adapter.testStates(event => {
                if (event.type === 'started') {
                    startedNotifications++;
                } else if (event.type === 'finished') {
                    finishedNotifications++;
                } else if (event.type === 'test') {
                    states.push(event);
                } else {
                    /* */
                }
            });
            await adapter.run(suites.map(s => s.id));

            expect(startedNotifications).to.be.eq(1);
            expect(startedNotifications).to.be.eq(finishedNotifications);

            expect(states).to.be.not.empty;
            expect(states).to.have.length(testsToRun.length);
            states.forEach(state => {
                const expectedState = extractExpectedState(state.test as string);
                expect(state.state).to.be.eq(expectedState);
            });
        });

        test('discovered tests should be sorted alphabetically', async () => {
            const adapter = new PythonTestAdapter(workspaceFolder, runner, logger());
            let startedNotifications = 0;
            let finishedNotifications = 0;
            let finishedEvent: TestLoadFinishedEvent | undefined;
            adapter.tests(event => {
                if (event.type === 'started') {
                    startedNotifications++;
                } else {
                    finishedNotifications++;
                    finishedEvent = event;
                }
            });
            await adapter.load();

            expect(startedNotifications).to.be.eq(1);
            expect(startedNotifications).to.be.eq(finishedNotifications);

            expect(finishedEvent!.errorMessage).to.be.undefined;
            expect(finishedEvent!.suite).to.be.not.undefined;
            expect(finishedEvent!.suite!.children).to.be.not.empty;

            const suiteToCheck = findTestSuiteByLabel(finishedEvent!.suite!, suiteToSort.suite)! as TestSuiteInfo;
            expect(suiteToCheck.type).to.be.eq('suite');
            expect(suiteToCheck.children).to.be.not.empty;
            expect(suiteToCheck.children.map(t => t.label)).to.have.ordered.members(suiteToSort.sortedTests);
        });
    });
});
