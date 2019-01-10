import { expect } from 'chai';
import 'mocha';
import * as path from 'path';

import { parseTestSuites } from '../src/pytest/pytestTestCollectionParser';

suite('Pytest test collection parser', () => {
  test('should parse pytest output', () => {
    const suites = parseTestSuites(`
============================== test session starts ==============================
platform linux -- Python 3.6.6, pytest-3.8.0, py-1.6.0, pluggy-0.7.1
rootdir: /some/prefix, inifile:
plugins: describe-0.11.1
collected 73 items / 1 errors
<Module 'pytest/test/describe_test.py'>
  <DescribeBlock 'describe_list'>
    <DescribeBlock 'describe_append'>
      <Function 'adds_to_end_of_list'>
    <DescribeBlock 'describe_remove'>
      <Function 'removes_item_from_list'>
<Module 'pytest/test/generate_test.py'>
  <Class 'TestSampleWithScenarios'>
    <Instance '()'>
      <Function 'test1[basic]'>
      <Function 'test1[advanced]'>
<Module 'pytest/test/string_test.py'>
  <Function 'test_lower'>
  <Function 'test_capitalize'>
  <UnitTestCase 'StringTestCaseOnSameLevelAsFunctions'>
    <TestCaseFunction 'test_capitalize'>
    <TestCaseFunction 'test_lower'>
<Module 'pytest/test/inner_tests/add_test.py'>
  <Function 'test_one_plus_two_is_three'>
  <Function 'test_two_plus_two_is_five'>
<Package '/some/prefix/unittest/basic_tests'>
  <Module 'test_add.py'>
    <UnitTestCase 'AddTests'>
      <TestCaseFunction 'test_two_plus_one_is_three_passed'>
      <TestCaseFunction 'test_two_plus_two_is_five_failed'>
      <TestCaseFunction 'test_two_plus_zero_is_two_skipped'>
  <Package '/some/prefix/unittest/basic_tests/initialization_output_tests'>
    <Module 'test_with_initialization_output.py'>
      <UnitTestCase 'TestWithOutputBeforeImport'>
        <TestCaseFunction 'test_stuff_passed'>
<Package '/some/prefix/unittest/setup_tests'>
  <Module 'test_with_setup.py'>
    <UnitTestCase 'TestWithSetUpClassMethod'>
      <TestCaseFunction 'test_set_up_called_before_test_case1_passed'>
      <TestCaseFunction 'test_set_up_called_before_test_case2_passed'>
<Module 'unittest/unittest_without_init/test_without_init.py'>
  <UnitTestCase 'AddTestsWithoutInit'>
    <TestCaseFunction 'test_two_plus_one_is_three_passed'>
    <TestCaseFunction 'test_two_plus_two_is_five_failed'>
    <TestCaseFunction 'test_two_plus_zero_is_two_skipped'>
<Module 'nested_tests/nested_tests.py'>
  <Class 'Test_CheckApp'>
    <Instance '()'>
      <Function 'test_simple_check'>
      <Function 'test_complex_check'>
      <Class 'Test_NestedClassA'>
        <Instance '()'>
          <Function 'test_nested_class_methodB'>
          <Class 'Test_nested_classB_Of_A'>
            <Instance '()'>
              <Function 'test_d'>

==================================== ERRORS =====================================
_________________ ERROR collecting pytest/test/describe_test.py _________________
/python2.7/site-packages/pytest_describe/plugin.py:110: in _getobj
    return self._importtestmodule()
/python2.7/site-packages/pytest_describe/plugin.py:119: in _importtestmodule
    copy_markinfo(module, self.funcobj)
/python2.7/site-packages/pytest_describe/plugin.py:60: in copy_markinfo
    from _pytest.mark import MarkInfo
E   ImportError: cannot import name MarkInfo
!!!!!!!!!!!!!!!!!!!! Interrupted: 1 errors during collection !!!!!!!!!!!!!!!!!!!!
============================ 1 error in 0.76 seconds ============================
`, '/some/prefix');
    expect(suites).to.be.not.empty;
    expect(suites).to.have.deep.members([
      {
        type: 'suite',
        id: path.resolve('/some/prefix/', 'pytest/test/describe_test.py'),
        file: path.resolve('/some/prefix/', 'pytest/test/describe_test.py'),
        label: 'describe_test.py',
        children: [
          {
            type: 'suite',
            id: `${path.resolve('/some/prefix/', 'pytest/test/describe_test.py')}::describe_list`,
            file: path.resolve('/some/prefix/', 'pytest/test/describe_test.py'),
            label: 'describe_list',
            children: [
              {
                type: 'suite',
                id: `${path.resolve('/some/prefix/', 'pytest/test/describe_test.py')}::describe_list::describe_append`,
                file: path.resolve('/some/prefix/', 'pytest/test/describe_test.py'),
                label: 'describe_append',
                children: [
                  {
                    type: 'test',
                    id: path.resolve('/some/prefix/', 'pytest/test/describe_test.py')
                      + '::describe_list::describe_append::adds_to_end_of_list',
                    label: 'adds_to_end_of_list',
                  }
                ],
              },
              {
                type: 'suite',
                id: `${path.resolve('/some/prefix/', 'pytest/test/describe_test.py')}::describe_list::describe_remove`,
                file: path.resolve('/some/prefix/', 'pytest/test/describe_test.py'),
                label: 'describe_remove',
                children: [
                  {
                    type: 'test',
                    id: path.resolve('/some/prefix/', 'pytest/test/describe_test.py')
                      + '::describe_list::describe_remove::removes_item_from_list',
                    label: 'removes_item_from_list',
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        type: 'suite',
        id: path.resolve('/some/prefix/', 'pytest/test/generate_test.py'),
        file: path.resolve('/some/prefix/', 'pytest/test/generate_test.py'),
        label: 'generate_test.py',
        children: [
          {
            type: 'suite',
            id: `${path.resolve('/some/prefix/', 'pytest/test/generate_test.py')}::TestSampleWithScenarios`,
            file: path.resolve('/some/prefix/', 'pytest/test/generate_test.py'),
            label: 'TestSampleWithScenarios',
            children: [
              {
                type: 'test',
                id: path.resolve('/some/prefix/', 'pytest/test/generate_test.py')
                  + '::TestSampleWithScenarios::test1[basic]',
                label: 'test1[basic]',
              },
              {
                type: 'test',
                id: path.resolve('/some/prefix/', 'pytest/test/generate_test.py') +
                  '::TestSampleWithScenarios::test1[advanced]',
                label: 'test1[advanced]',
              }
            ],
          }
        ],
      },
      {
        type: 'suite',
        id: path.resolve('/some/prefix/', 'pytest/test/string_test.py'),
        file: path.resolve('/some/prefix/', 'pytest/test/string_test.py'),
        label: 'string_test.py',
        children: [
          {
            type: 'test',
            id: `${path.resolve('/some/prefix/', 'pytest/test/string_test.py')}::test_lower`,
            label: 'test_lower',
          },
          {
            type: 'test',
            id: `${path.resolve('/some/prefix/', 'pytest/test/string_test.py')}::test_capitalize`,
            label: 'test_capitalize',
          },
          {
            type: 'suite',
            id: `${path.resolve('/some/prefix/', 'pytest/test/string_test.py')}::StringTestCaseOnSameLevelAsFunctions`,
            file: path.resolve('/some/prefix/', 'pytest/test/string_test.py'),
            label: 'StringTestCaseOnSameLevelAsFunctions',
            children: [
              {
                type: 'test',
                id: path.resolve('/some/prefix/', 'pytest/test/string_test.py') +
                  '::StringTestCaseOnSameLevelAsFunctions::test_capitalize',
                label: 'test_capitalize',
              },
              {
                type: 'test',
                id: path.resolve('/some/prefix/', 'pytest/test/string_test.py') +
                  '::StringTestCaseOnSameLevelAsFunctions::test_lower',
                label: 'test_lower',
              }
            ],
          }
        ],
      },
      {
        children: [
          {
            id: `${path.resolve('/some/prefix/', 'pytest/test/inner_tests/add_test.py')}::test_one_plus_two_is_three`,
            label: 'test_one_plus_two_is_three',
            type: 'test',
          },
          {
            id: `${path.resolve('/some/prefix/', 'pytest/test/inner_tests/add_test.py')}::test_two_plus_two_is_five`,
            label: 'test_two_plus_two_is_five',
            type: 'test',
          }
        ],
        id: path.resolve('/some/prefix/', 'pytest/test/inner_tests/add_test.py'),
        file: path.resolve('/some/prefix/', 'pytest/test/inner_tests/add_test.py'),
        label: 'add_test.py',
        type: 'suite',
      },
      {
        children: [
          {
            children: [
              {
                id: path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py') +
                  '::AddTests::test_two_plus_one_is_three_passed',
                label: 'test_two_plus_one_is_three_passed',
                type: 'test',
              },
              {
                id: path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py') +
                  '::AddTests::test_two_plus_two_is_five_failed',
                label: 'test_two_plus_two_is_five_failed',
                type: 'test',
              },
              {
                id: path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py') +
                  '::AddTests::test_two_plus_zero_is_two_skipped',
                label: 'test_two_plus_zero_is_two_skipped',
                type: 'test',
              }
            ],
            id: `${path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py')}::AddTests`,
            file: path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py'),
            label: 'AddTests',
            type: 'suite',
          }
        ],
        id: path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py'),
        file: path.resolve('/some/prefix/', 'unittest/basic_tests/test_add.py'),
        label: 'test_add.py',
        type: 'suite',
      },
      {
        children: [
          {
            children: [
              {
                id: path.resolve('/some/prefix/',
                  'unittest/basic_tests/initialization_output_tests/test_with_initialization_output.py') +
                  '::TestWithOutputBeforeImport::test_stuff_passed',
                label: 'test_stuff_passed',
                type: 'test',
              }
            ],
            id: path.resolve(
              '/some/prefix/',
              'unittest/basic_tests/initialization_output_tests/test_with_initialization_output.py') +
              '::TestWithOutputBeforeImport',
            file: path.resolve(
              '/some/prefix/',
              'unittest/basic_tests/initialization_output_tests/test_with_initialization_output.py'),
            label: 'TestWithOutputBeforeImport',
            type: 'suite',
          }
        ],
        id: path.resolve(
          '/some/prefix/',
          'unittest/basic_tests/initialization_output_tests/test_with_initialization_output.py'),
        file: path.resolve(
          '/some/prefix/',
          'unittest/basic_tests/initialization_output_tests/test_with_initialization_output.py'),
        label: 'test_with_initialization_output.py',
        type: 'suite',
      },
      {
        children: [
          {
            children: [
              {
                id: path.resolve('/some/prefix/', 'unittest/setup_tests/test_with_setup.py') +
                  '::TestWithSetUpClassMethod::test_set_up_called_before_test_case1_passed',
                label: 'test_set_up_called_before_test_case1_passed',
                type: 'test',
              },
              {
                id: path.resolve('/some/prefix/', 'unittest/setup_tests/test_with_setup.py') +
                  '::TestWithSetUpClassMethod::test_set_up_called_before_test_case2_passed',
                label: 'test_set_up_called_before_test_case2_passed',
                type: 'test',
              }
            ],
            id: path.resolve('/some/prefix/', 'unittest/setup_tests/test_with_setup.py') + '::TestWithSetUpClassMethod',
            file: path.resolve('/some/prefix/', 'unittest/setup_tests/test_with_setup.py'),
            label: 'TestWithSetUpClassMethod',
            type: 'suite',
          }
        ],
        id: path.resolve('/some/prefix/', 'unittest/setup_tests/test_with_setup.py'),
        file: path.resolve('/some/prefix/', 'unittest/setup_tests/test_with_setup.py'),
        label: 'test_with_setup.py',
        type: 'suite',
      },
      {
        children: [
          {
            children: [
              {
                id: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py')
                  + '::AddTestsWithoutInit::test_two_plus_one_is_three_passed',
                label: 'test_two_plus_one_is_three_passed',
                type: 'test',
              },
              {
                id: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py') +
                  '::AddTestsWithoutInit::test_two_plus_two_is_five_failed',
                label: 'test_two_plus_two_is_five_failed',
                type: 'test',
              },
              {
                id: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py') +
                  '::AddTestsWithoutInit::test_two_plus_zero_is_two_skipped',
                label: 'test_two_plus_zero_is_two_skipped',
                type: 'test',
              }
            ],
            id: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py') +
              '::AddTestsWithoutInit',
            file: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py'),
            label: 'AddTestsWithoutInit',
            type: 'suite',
          }
        ],
        id: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py'),
        file: path.resolve('/some/prefix/', 'unittest/unittest_without_init/test_without_init.py'),
        label: 'test_without_init.py',
        type: 'suite',
      },
      {
        children: [
          {
            children: [
              {
                id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') +
                  '::Test_CheckApp::test_simple_check',
                label: 'test_simple_check',
                type: 'test',
              },
              {
                id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') +
                  '::Test_CheckApp::test_complex_check',
                label: 'test_complex_check',
                type: 'test',
              },
              {
                children: [
                  {
                    id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') +
                      '::Test_CheckApp::Test_NestedClassA::test_nested_class_methodB',
                    label: 'test_nested_class_methodB',
                    type: 'test',
                  },
                  {
                    children: [
                      {
                        id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') +
                          '::Test_CheckApp::Test_NestedClassA::Test_nested_classB_Of_A::test_d',
                        label: 'test_d',
                        type: 'test',
                      }
                    ],
                    id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') +
                      '::Test_CheckApp::Test_NestedClassA::Test_nested_classB_Of_A',
                    file: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py'),
                    label: 'Test_nested_classB_Of_A',
                    type: 'suite',
                  }
                ],
                id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') +
                  '::Test_CheckApp::Test_NestedClassA',
                file: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py'),
                label: 'Test_NestedClassA',
                type: 'suite',
              }
            ],
            id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py') + '::Test_CheckApp',
            file: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py'),
            label: 'Test_CheckApp',
            type: 'suite',
          }
        ],
        id: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py'),
        file: path.resolve('/some/prefix/', 'nested_tests/nested_tests.py'),
        label: 'nested_tests.py',
        type: 'suite',
      }
    ]);
  });
});
