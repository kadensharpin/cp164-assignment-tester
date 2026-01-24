//@ts-check
/**
 * @import {Assignments,Task} from "./index.d.ts"
 * @import {Action} from "./create-assignment.d.ts"
 */

const ASSIGNMENT = "assignment";
const MODULE = "module";
const FILE = "file";

const fs = require("fs/promises");
const path = require("path");
const action = process.argv[2]?.toLowerCase();

if (action === ASSIGNMENT || action === "a") {
  main(createAssignment);
} else if (action === MODULE || action === "m") {
  main(createModule);
} else if (action === FILE || action === "f") {
  main(createFile);
} else {
  const programName =
    path.basename(process.argv[0]) + " " + path.basename(process.argv[1]);
  exit(`Usage:
${programName} ${ASSIGNMENT}|a <input-dir>
${programName} ${MODULE}|m <file.py>
${programName} ${FILE}|f <file.txt>`);
}

/**
 * @param {string} msg
 * @returns {never}
 */
function exit(msg) {
  console.error(msg);
  process.exit(1);
}

/** @param {Action} fn */
async function main(fn) {
  /** @type {Assignments} */
  const assignments = await fs
    .readFile("assignments.json", "utf8")
    .then(JSON.parse);

  await fn(assignments, process.argv.slice(3));

  await fs.writeFile("assignments.json", JSON.stringify(assignments));
}

/** @type {Action} */
async function createAssignment(assignments, args) {
  const inputDir = args[0];
  if (!inputDir) {
    exit("No input dir specified");
  }

  /** @type {Task[]} */
  // @ts-expect-error
  const tasks = (await readTasks(inputDir)).filter((task) => task);
  if (tasks.length == 0) {
    exit("No tasks");
  }

  const name = getNextAssignmentName(assignments);
  assignments.assignments[name] = { tasks, files: ["functions.py"] };
}

/** @param {Assignments} assignments */
function getNextAssignmentName(assignments) {
  const names = Object.keys(assignments.assignments);
  let num = 1;
  for (const name of names) {
    num = Math.max(num, parseNum(name) + 1);
  }
  return (
    "Assignment #" + num.toLocaleString(undefined, { minimumIntegerDigits: 2 })
  );
}

/** @param {string} inputDir */
async function readTasks(inputDir) {
  if (!(await fs.stat(inputDir).catch(catchFileError)).isDirectory()) {
    exit("The input dir is not a directory");
  }
  const filenames = await fs.readdir(inputDir);
  const files = await Promise.all(
    filenames.map((filename) =>
      fs
        .readFile(path.resolve(inputDir, filename), "utf8")
        .then((contents) => [filename, contents]),
    ),
  );
  return files.map(([filename, contents]) => readTask(filename, contents));
}

/**
 * @param {string} filename
 * @param {string} contents
 * @returns {Task | null}
 */
function readTask(filename, contents) {
  if (!filename.startsWith("t") || !filename.endsWith(".py")) return null;
  const number = parseNum(filename);
  const lines = contents.split("\n");
  const name = lines[2];
  let line = lines.shift();
  do {
    line = lines.shift()?.trim();
  } while (line !== undefined && line !== '"""');
  if (lines.length === 0) exit("Invalid file: " + filename);
  return {
    number,
    name,
    code: lines.join("\n"),
  };
}

/** @param {string} text */
function parseNum(text) {
  return Number(text.replace(/[^0-9]/g, "")) || 0;
}

/**
 * @param {any} err
 * @returns {never}
 */
function catchFileError(err) {
  let message = String(err);
  if (err instanceof Error) {
    if ("code" in err && err.code === "ENOENT") {
      message = "File doesn't exist";
      if ("path" in err) {
        message = `File '${err.path}' doesn't exist`;
      }
    }
  }
  exit(err);
}

/** @type {Action} */
async function createModule(assignments, args) {
  const filename = args[0];
  if (!filename) {
    exit("No filename specified");
  }

  const code = await fs.readFile(filename, "utf8").catch(catchFileError);
  const name = path.basename(filename).replace(/\.py$/, "");

  assignments.modules[name] = code.replace(/\r/g, "");
}

/** @type {Action} */
async function createFile(assignments, args) {
  const filename = args[0];
  if (!filename) {
    exit("No filename specified");
  }

  const contents = await fs.readFile(filename, "utf8").catch(catchFileError);
  const name = path.basename(filename);

  assignments.files[name] = contents.replace(/\r/g, "");
}
