from pyscript import window, ffi
import io


def run_script(script):
    exec(script)


def clear_terminal():
    __terminal__.clear()


def create_file(file_name, file_contents):
    with open(file_name, 'wt', encoding='utf8') as f:
        f.write(file_contents)


window.runScript = ffi.create_proxy(run_script)
window.clearTerminal = ffi.create_proxy(clear_terminal)
window.createFile = ffi.create_proxy(create_file)
window.onPythonReady()
