import { expect } from 'chai';
import 'mocha';
import * as path from 'path';

import {
    IPytestConfiguration,
    IUnittestConfiguration, IWorkspaceConfiguration
} from '../../src/configuration/workspaceConfiguration';
import { PytestTestRunner } from '../../src/pytest/pytestTestRunner';
import { PlaceholderAwareWorkspaceConfiguration } from '../../src/configuration/placeholderAwareWorkspaceConfiguration';
import { getPythonExecutable } from '../utils/testConfiguration';
import { extractExpectedState, extractErroredTests, findTestSuiteByLabel, logger, findWorkspaceFolder } from '../utils/helpers';

function createPytestConfiguration(args?: string[]): IWorkspaceConfiguration {
    const wf = findWorkspaceFolder('pytest')!;
    return new PlaceholderAwareWorkspaceConfiguration({
        pythonPath(): string {
            return getPythonExecutable();
        },
        getCwd(): string {
            return wf.uri.fsPath;
        },
        envFile(): string {
            return path.join(wf.uri.fsPath, '..', '.env');
        },
        getUnittestConfiguration(): IUnittestConfiguration {
            throw new Error();
        },
        getPytestConfiguration(): IPytestConfiguration {
            return {
                pytestPath: () => '${workspaceFolder}/pytest.sh',
                isPytestEnabled: true,
                pytestArguments: args || [],
            };
        },
    }, wf, logger());
}

suite('Pytest test discovery with a script', async () => {
    const config: IWorkspaceConfiguration = createPytestConfiguration();
    const runner = new PytestTestRunner('some-id', logger());

    test('should discover tests', async () => {
        const mainSuite = await runner.load(config);
        expect(mainSuite).to.be.not.undefined;
        const expectedSuites = [
            'describe_test.py',
            'env_variables_test.py',
            'fixture_test.py',
            'generate_test.py',
            'inner_fixture_test.py',
            'string_test.py',
            'subprocess_test.py',
            'add_test.py',
            'add_test.py',
            'Discovery error in invalid_syntax_test.py',
            'Discovery error in non_existing_module_test.py'
        ];
        const labels = mainSuite!.children.map(x => x.label);
        expect(labels).to.have.members(expectedSuites);
    });
});

suite('Pytest test execution with a script', () => {
    const config: IWorkspaceConfiguration = createPytestConfiguration(
        ['--ignore=test/import_error_tests']
    );
    const runner = new PytestTestRunner('some-id', logger());

    test('should run all tests', async () => {
        const mainSuite = await runner.load(config);
        expect(mainSuite).to.be.not.undefined;
        expect(extractErroredTests(mainSuite!)).to.be.empty;
        expect(mainSuite!.label).to.be.eq('Pytest tests');
        const states = await runner.run(config, runner.adapterId);
        expect(states).to.be.not.empty;
        states.forEach(state => {
            const expectedState = extractExpectedState(state.test as string);
            expect(state.state).to.be.eq(expectedState);
        });
    });

    [
        {
            suite: { label: 'string_test.py' },
            cases: [
                { file: 'test/string_test.py', case: '::test_lower_passed' },
                { file: 'test/string_test.py', case: '::test_capitalize_passed' },
                {
                    file: 'test/string_test.py',
                    case: '::StringTestCaseOnSameLevelAsFunctions::test_capitalize_passed',
                },
                {
                    file: 'test/string_test.py',
                    case: '::StringTestCaseOnSameLevelAsFunctions::test_lower_passed',
                }
            ],
        },
        {
            suite: { label: 'add_test.py', description: 'inner_tests' },
            cases: [
                { file: 'test/inner_tests/add_test.py', case: '::test_one_plus_two_is_three_passed' },
                { file: 'test/inner_tests/add_test.py', case: '::test_two_plus_two_is_five_failed' }
            ],
        },
        {
            suite: { label: 'Test_NestedClassB' },
            cases: [
                {
                    file: 'test/inner_fixture_test.py',
                    case: '::Test_CheckMyApp::Test_NestedClassB::Test_nested_classC_Of_B::test_e_passed',
                }
            ],
        },
        {
            suite: { label: 'describe_append' },
            cases: [
                {
                    file: 'test/describe_test.py',
                    case: '::describe_list::describe_append::adds_to_end_of_list_passed',
                }
            ],
        }
    ].forEach(({ suite, cases }) => {
        test(`should run ${suite.label} suite`, async () => {
            const mainSuite = await runner.load(config);
            expect(mainSuite).to.be.not.undefined;
            expect(extractErroredTests(mainSuite!)).to.be.empty;
            const suiteToRun = findTestSuiteByLabel(mainSuite!, suite.label, suite.description);
            expect(suiteToRun).to.be.not.undefined;
            const states = await runner.run(config, suiteToRun!.id);
            expect(states).to.be.not.empty;
            const cwd = config.getCwd();
            expect(states.map(s => s.test)).to.have.deep.members(
                cases.map(c => path.resolve(cwd, c.file) + c.case)
            );
            states.forEach(state => {
                const expectedState = extractExpectedState(state.test as string);
                expect(state.state).to.be.eq(expectedState);
            });
        });
    });

    [
        'test_one_plus_two_is_three_passed',
        'test_two_plus_two_is_five_failed',
        'test_capitalize_passed',
        'test_lower_passed',
        'test_passed[3-a-z]',
        'test_nested_class_methodC_passed',
        'test_d_passed',
        'removes_item_from_list_passed'
    ].forEach(testMethod => {
        test(`should run ${testMethod} test`, async () => {
            const mainSuite = await runner.load(config);
            expect(mainSuite).to.be.not.undefined;
            expect(extractErroredTests(mainSuite!)).to.be.empty;
            const suite = findTestSuiteByLabel(mainSuite!, testMethod);
            expect(suite).to.be.not.undefined;
            const states = await runner.run(config, suite!.id);
            expect(states).to.be.not.empty;
            states.forEach(state => {
                const expectedState = extractExpectedState(state.test as string);
                expect(state.state).to.be.eq(expectedState);
            });
        });
    });

    test('should capture output from failing test', async () => {
        const mainSuite = await runner.load(config);
        expect(mainSuite).to.be.not.undefined;
        expect(extractErroredTests(mainSuite!)).to.be.empty;
        const suite = findTestSuiteByLabel(mainSuite!, 'test_two_plus_two_is_five_failed');
        expect(suite).to.be.not.undefined;
        const states = await runner.run(config, suite!.id);
        expect(states).to.be.have.length(1);
        const state = states[0];
        const expectedState = extractExpectedState(state.test as string);
        expect(state.state).to.be.eq(expectedState);
        expect(state.message).to.be.not.empty;
        expect(state.message).contains('Hello from test_two_plus_two_is_five_failed');
        expect(state.decorations).to.be.have.length(1);
        expect(state.decorations![0].line).to.be.equal(9);
        expect(state.decorations![0].message).to.satisfy((m: string) => m.startsWith('assert (2 + 2) == 5'));
    });

    [
        'test_environment_variable_from_env_file_passed',
        'test_environment_variable_from_process_passed'
    ].forEach(testMethod => {
        test(`should load evironment variables for ${testMethod} test`, async () => {
            const mainSuite = await runner.load(config);
            expect(mainSuite).to.be.not.undefined;
            expect(extractErroredTests(mainSuite!)).to.be.empty;
            const suite = findTestSuiteByLabel(mainSuite!, testMethod);
            expect(suite).to.be.not.undefined;
            const states = await runner.run(config, suite!.id);
            expect(states).to.be.not.empty;
            states.forEach(state => {
                expect(state.state).to.be.eq(extractExpectedState(state.test as string));
            });
        });
    });
});
