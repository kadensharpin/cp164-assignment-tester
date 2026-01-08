from pyscript import window, ffi
import io


def runScript(script):
    exec(script)


def clearTerminal():
    __terminal__.clear()


window.runScript = ffi.create_proxy(runScript)
window.clearTerminal = ffi.create_proxy(clearTerminal)


def emulate_file(text):
	binary_file = io.BytesIO(text.encode('utf8'))
	return io.TextIOWrapper(binary_file, encoding='utf8')
