import { expect } from 'chai';
import 'mocha';
import * as vscode from 'vscode';
import { VscodeWorkspaceConfiguration } from '../src/vscodeWorkspaceConfiguration';
import { findWorkspaceFolder } from './helpers';

function createWorkspaceConfiguration(name: string) {
    const ws = findWorkspaceFolder(name)!;
    return new VscodeWorkspaceConfiguration(ws);
}

suite('VSCode workspace configuration', () => {
    const defaults = vscode.workspace.getConfiguration(undefined, null);

    test('should return default values on empty configuration', () => {
        const configuration = createWorkspaceConfiguration('empty_configuration');
        expect(configuration.getUnittestConfiguration().isUnittestEnabled).to.be.eq(
            defaults.get<boolean>('python.unitTest.unittestEnabled', false)
        );
        expect(configuration.pythonPath()).to.be.eq(
            defaults.get<string>('python.pythonPath', 'python')
        );
        expect(configuration.getCwd()).to.be.eq(
            defaults.get<string>('python.unitTest.cwd') || configuration.workspaceFolder.uri.fsPath
        );
    });

    test.skip('should return values from python extension configuration (unittest)', () => {
        const configuration = createWorkspaceConfiguration('python_extension_configured_unittest');
        expect(configuration.getUnittestConfiguration().isUnittestEnabled).to.be.true;
        expect(configuration.pythonPath()).to.be.eq('/some/path/to/python');
        expect(configuration.getCwd()).to.be.eq('/some/unittest/cwd');
    });

    test.skip('should return values from python extension configuration (pytest)', () => {
        const configuration = createWorkspaceConfiguration('python_extension_configured_pytest');
        expect(configuration.getPytestConfiguration().isPytestEnabled).to.be.true;
        expect(configuration.pythonPath()).to.be.eq('/some/path/to/python');
        expect(configuration.getCwd()).to.be.eq('/some/unittest/cwd');
    });

    test('should return values overridden by python test explorer (unittest)', () => {
        const configuration = createWorkspaceConfiguration('test_framework_overridden_unittest');
        expect(configuration.getUnittestConfiguration().isUnittestEnabled).to.be.true;
        expect(configuration.getPytestConfiguration().isPytestEnabled).to.be.false;
    });

    test('should return values overridden by python test explorer (pytest)', () => {
        const configuration = createWorkspaceConfiguration('test_framework_overridden_pytest');
        expect(configuration.getUnittestConfiguration().isUnittestEnabled).to.be.false;
        expect(configuration.getPytestConfiguration().isPytestEnabled).to.be.true;
    });
});
