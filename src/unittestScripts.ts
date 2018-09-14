
export function unittestHelperScript(configuration: { startDirectory: string, pattern: string }) {
    return `
from __future__ import print_function
from unittest import TextTestRunner, TextTestResult, TestLoader
import sys
import base64

loader = TestLoader()

class TextTestResultWithSuccesses(TextTestResult):
    def __init__(self, *args, **kwargs):
        super(TextTestResultWithSuccesses, self).__init__(*args, **kwargs)
        self.successes = []

    def addSuccess(self, test):
        super(TextTestResultWithSuccesses, self).addSuccess(test)
        self.successes.append(test)


def get_tests(suite):
    if hasattr(suite, '__iter__'):
        tests = []
        for x in suite:
            tests.extend(get_tests(x))
        return tests
    else:
        return [suite]


def discover_tests():
    suites = loader.discover("${configuration.startDirectory}", pattern="${configuration.pattern}")
    return get_tests(suites)


def load_tests(test_names):
    all_tests = discover_tests()
    if not test_names:
        return all_tests
    return filter(lambda test: any(test.id().startswith(name) for name in test_names), all_tests)


def run_tests(test_names):
    runner = TextTestRunner(resultclass=TextTestResultWithSuccesses)
    results = [runner.run(loader.loadTestsFromName(name)) for name in test_names]
    print("==TEST RESULTS==")

    for result in results:
        for r in result.skipped:
            print("skipped:", r[0].id(), ":", base64.b64encode(
                r[1].encode('utf8')).decode('ascii'))

        for r in result.failures:
            print("failed:", r[0].id(), ":", base64.b64encode(
                r[1].encode('utf8')).decode('ascii'))

        for r in result.successes:
            print("passed:", r.id())


action = sys.argv[1]
if action == "discover":
    tests = discover_tests()
    print("==DISCOVERED TESTS==")
    for test in tests:
        print(test.id())
elif action == "run":
    run_tests(sys.argv[2:])
else:
    raise ValueError("invalid command: should be discover or run")`;
}
