import os


def test_environment_variable_from_env_file_passed():
    assert 'SOME_FILE_VARIABLE' in os.environ
    assert os.getenv('SOME_FILE_VARIABLE') == 'HelloFromEnvFile'


def test_environment_variable_from_process_passed():
    assert 'SOME_PROCESS_VARIABLE' in os.environ
    assert os.getenv('SOME_PROCESS_VARIABLE') == 'HelloFromProcessEnv'
