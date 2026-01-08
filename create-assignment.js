//@ts-check
/** @typedef {{number:number,name:string,code:string}} Task */
/** @typedef {{[name: string]:Task[]}} Assignments */

const fs = require("fs/promises");
const path = require("path");
const input_dir = process.argv[2];

if (!input_dir) {
  console.error("No input dir specified");
  process.exit(1);
}

main();

async function main() {
  /** @type {Assignments} */
  const assignments = await fs
    .readFile("assignments.json", "utf8")
    .then(JSON.parse);

  /** @type {Task[]} */
  // @ts-expect-error
  const tasks = (await readTasks()).filter((task) => task);
  if (tasks.length == 0) {
    console.error("No tasks");
    process.exit(1);
  }

  const name = getNextAssignmentName(assignments);
  assignments[name] = tasks;

  await fs.writeFile("assignments.json", JSON.stringify(assignments));
}

/** @param {Assignments} assignments */
function getNextAssignmentName(assignments) {
  const names = Object.keys(assignments);
  let num = 1;
  for (const name of names) {
    num = Math.max(num, parseNum(name) + 1);
  }
  return (
    "Assignment #" + num.toLocaleString(undefined, { minimumIntegerDigits: 2 })
  );
}

async function readTasks() {
  if (!(await fs.stat(input_dir)).isDirectory()) {
    console.error("The input dir is not a directory");
    process.exit(1);
  }
  const filenames = await fs.readdir(input_dir);
  const files = await Promise.all(
    filenames.map((filename) =>
      fs
        .readFile(path.resolve(input_dir, filename), "utf8")
        .then((contents) => [filename, contents])
    )
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
  const num = parseNum(filename);
  const lines = contents.split("\n");
  return {
    number: num,
    name: lines[2],
    code: lines.slice(13).join("\n"),
  };
}

/** @param {string} text */
function parseNum(text) {
  return Number(text.replace(/[^0-9]/g, "")) || 0;
}
