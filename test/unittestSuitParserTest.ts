import { expect } from 'chai';
import 'mocha';
import { TestSuiteInfo } from 'vscode-test-adapter-api';

import { ALL_TESTS_SUIT_ID, parseTestStates, parseTestSuits } from '../src/unittestSuitParser';

function notEmptyRootSuit(suite?: TestSuiteInfo) {
    return suite != null && suite.id === ALL_TESTS_SUIT_ID;
}

describe('Unittest suite parser', () => {
    it('should return empty root suite for empty output', () => {
        const rootSuit = parseTestSuits('', '/some/prefix/path');
        expect(rootSuit).to.satisfies(notEmptyRootSuit);
        expect(rootSuit.children).to.be.empty;
    });

    it('should return empty suit when input can not be parsed', () => {
        const rootSuit = parseTestSuits('some string without dots', '/some/prefix/path');
        expect(rootSuit).to.satisfies(notEmptyRootSuit);
        expect(rootSuit.children).to.be.empty;
    });

    it('should create single test and suite for a single test', () => {
        const prefixPath = '/some/prefix/path';
        const expectedSuitLabel = 'TestCase1';
        const expectedSuitId = 'some_test_module.' + expectedSuitLabel;
        const expectedTestLabel = 'test_function';
        const expectedTestId = expectedSuitId + '.test_function';

        const rootSuit = parseTestSuits('some_test_module.TestCase1.test_function', prefixPath);
        expect(rootSuit).to.satisfies(notEmptyRootSuit);
        expect(rootSuit.children).to.be.not.empty;
        expect(rootSuit.children).to.have.length(1);
        expect(rootSuit.children[0].type).to.be.eq('suite');

        const singleSuit: TestSuiteInfo = rootSuit.children[0] as TestSuiteInfo;
        expect(singleSuit).to.be.not.null;
        expect(singleSuit).to.be.deep.eq({
            type: 'suite',
            id: expectedSuitId,
            label: expectedSuitLabel,
            file: prefixPath + '/some_test_module.py',
            children: [{
                type: 'test',
                id: expectedTestId,
                label: expectedTestLabel,
            }],
        });
    });

    it('should add multiple tests to suite with same suite id', () => {
        const prefixPath = '/some/prefix/path';
        const expectedSuitLabel = 'TestCase1';
        const expectedSuitId = 'some_test_module.' + expectedSuitLabel;
        const expectedTests = ['test_function1', 'test_function1'].map(label => ({
            id: expectedSuitId + '.' + label,
            label,
        }));

        const rootSuit = parseTestSuits(expectedTests.map(t => t.id).join('\n'), prefixPath);
        expect(rootSuit).to.satisfies(notEmptyRootSuit);
        expect(rootSuit.children).to.be.not.empty;
        expect(rootSuit.children).to.have.length(1);
        expect(rootSuit.children[0].type).to.be.eq('suite');

        const singleSuit: TestSuiteInfo = rootSuit.children[0] as TestSuiteInfo;
        expect(singleSuit).to.be.not.null;
        expect(singleSuit).to.be.deep.eq({
            type: 'suite',
            id: expectedSuitId,
            label: expectedSuitLabel,
            file: prefixPath + '/some_test_module.py',
            children: expectedTests.map(test => ({
                type: 'test',
                id: test.id,
                label: test.label,
            })),
        });
    });

    it('should add multiple tests to suite without module part', () => {
        const prefixPath = '/some/prefix/path';
        const expectedSuitLabel = 'TestCase1';
        const expectedSuitId = expectedSuitLabel;
        const expectedTests = ['test_function1', 'test_function1'].map(label => ({
            id: expectedSuitId + '.' + label,
            label,
        }));

        const rootSuit = parseTestSuits(expectedTests.map(t => t.id).join('\n'), prefixPath);
        expect(rootSuit).to.satisfies(notEmptyRootSuit);
        expect(rootSuit.children).to.be.not.empty;
        expect(rootSuit.children).to.have.length(1);
        expect(rootSuit.children[0].type).to.be.eq('suite');

        const singleSuit: TestSuiteInfo = rootSuit.children[0] as TestSuiteInfo;
        expect(singleSuit).to.be.not.null;
        expect(singleSuit).to.be.deep.eq({
            type: 'suite',
            id: expectedSuitId,
            label: expectedSuitLabel,
            file: undefined,
            children: expectedTests.map(test => ({
                type: 'test',
                id: test.id,
                label: test.label,
            })),
        });
    });
});

describe('Unittest test states parser', () => {
    it('should return no events when output is empty', () => {
        const states = parseTestStates('');
        expect(states).to.be.empty;
    });

    it('should return events for different states', () => {
        const testOutput = [
            'failed:some_module.TestCase1.test_function1:c29tZSBtdWx0aWxpbmUKZXJyb3IgbWVzc2FnZQ==',
            'success:some_module.TestCase1.test_function2',
            'skipped:some_module.TestCase1.test_function3',
            'success:some_other_module.TestCase2.test_function'
        ];
        const states = parseTestStates(testOutput.join('\n'));
        expect(states).to.be.not.empty;
        expect(states).to.have.deep.members(
            [
                {
                    type: 'test',
                    state: 'failed',
                    test: 'some_module.TestCase1.test_function1',
                    message: `some multiline
error message`,
                },
                {
                    type: 'test',
                    state: 'success',
                    test: 'some_module.TestCase1.test_function2',
                    message: undefined,
                },
                {
                    type: 'test',
                    state: 'skipped',
                    test: 'some_module.TestCase1.test_function3',
                    message: undefined,
                },
                {
                    type: 'test',
                    state: 'success',
                    test: 'some_other_module.TestCase2.test_function',
                    message: undefined,
                }
            ]
        );
    });

    it('should not fail when output is not formatted', () => {
        const testOutput = [
            'Error! Some severe error occurred and output is not readable!'
        ];
        const states = parseTestStates(testOutput.join('\n'));
        expect(states).to.be.empty;
    });
});
