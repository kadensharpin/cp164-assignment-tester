//@ts-check
/**
 * @import {Assignments} from "./index.d.ts"
 */

/** @type {(value?: any) => void} */
let fulfillPythonPromise;
const python = new Promise((s) => (fulfillPythonPromise = s));
window.onPythonReady = () => {
  document.body.classList.remove("loading");
  fulfillPythonPromise();
};

/** @ts-expect-error @type {HTMLSelectElement} */
const assignmentPicker = document.getElementById("assignment-picker");
/** @ts-expect-error @type {HTMLUListElement} */
const fileList = document.getElementById("file-list");
/** @ts-expect-error @type {HTMLUListElement} */
const taskList = document.getElementById("task-list");

/** @type {Assignments} */
const { assignments, modules, files } = await fetch("./assignments.json").then(
  (res) => res.json(),
);

python.then(() => {
  for (const [name, code] of Object.entries(modules)) {
    window.createFile(name + ".py", code);
  }
  for (const [name, contents] of Object.entries(files)) {
    window.createFile(name, contents);
  }
});

for (const name in assignments) {
  const option = document.createElement("option");
  option.text = name;
  assignmentPicker.appendChild(option);
}
assignmentPicker.addEventListener("change", (_ev) => {
  window.clearTerminal();
  while (taskList.firstElementChild) {
    taskList.firstElementChild.remove();
  }
  while (fileList.firstElementChild) {
    fileList.firstElementChild.remove();
  }
  const assignment = getCurrentAssignment();
  if (!assignment) return;
  const tasks = assignment.tasks.sort((a, b) => a.number - b.number);
  for (const task of tasks) {
    const li = document.createElement("li");

    const icon = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -700 700 700" class="test-icon">
            <circle cx="350" cy="-350" r="300" id="outline" stroke-width="70" />
            <path d="M491.3-389.5H330.1v79.2h240.4z" />
            <path d="M491.3-389.5V-709.1h79.2v398.8Z" />
            <path d="M490-309v-398.8h79.2v398.8Z" />
            <path d="M490-309v-398.8h79.2v398.8Z" />
          </svg>`;
    li.insertAdjacentHTML("afterbegin", icon);

    const taskNum = document.createElement("span");
    taskNum.innerText = "Task #" + task.number;
    li.appendChild(taskNum);

    const taskName = document.createElement("span");
    taskName.innerText = task.name;
    li.appendChild(taskName);

    taskList.appendChild(li);
  }
  let id = 1;
  for (const filename of assignment.files) {
    const li = document.createElement("li");
    const label = document.createElement("label");
    label.innerText = filename;
    li.appendChild(label);

    const input = document.createElement("input");
    input.type = "file";
    input.id = `file-input-${id++}`;
    input.addEventListener("change", onFileChange);
    label.htmlFor = input.id;
    li.appendChild(input);

    fileList.appendChild(li);
  }
});

/** @param {Event} ev */
async function onFileChange(ev) {
  /** @ts-expect-error @type {HTMLInputElement} */
  const filePicker = ev.target;
  const file = filePicker.files?.[0];
  if (!file) return;
  const label = filePicker.labels?.[0];
  if (label?.innerText !== file.name) {
    alert(`File must be named '${label?.innerText}'`);
    filePicker.value = "";
    return;
  }
  try {
    window.createFile(file.name, await file.text());
  } catch (err) {
    console.error(err);
    window.runScript(`print(${JSON.stringify(String(err))})`);
  }
  const inputs = Array.from(fileList.querySelectorAll("input"));
  if (inputs.every((input) => input.files?.[0])) {
    await runTests();
  }
}

async function runTests() {
  const assignment = getCurrentAssignment();
  const tasks = assignment?.tasks.sort((a, b) => a.number - b.number);
  if (!tasks) return;
  enableInputs(false);
  /** @type {Record<number, SVGSVGElement>} */
  const icons = {};
  const taskElements = taskList.querySelectorAll("svg");
  for (let x = 0; x < tasks.length; x++) {
    const task = tasks[x];
    icons[task.number] = taskElements[x];
    icons[task.number].classList.remove("failed", "checked");
  }
  window.clearTerminal();
  const inputs = fileList.querySelectorAll("input");
  const filenames = Array.from(inputs, (input) =>
    input.files?.[0].name.slice(0, -3),
  );

  const imports = `from importlib import reload\n${filenames.map((f) => `import ${f}`).join("\n")}\n`;
  const reloads = filenames.map((f) => `reload(${f})`).join("\n");
  try {
    window.runScript(`${imports}\n${reloads}`);
  } catch (err) {
    console.error(err);
    window.runScript(`print(${JSON.stringify(String(err))})`);
    return;
  }
  for (const task of tasks) {
    try {
      window.runScript(task.code);
      icons[task.number]?.classList.add("checked");
      await new Promise((s) => setTimeout(s, window.scriptRunDelay));
    } catch (err) {
      icons[task.number]?.classList.add("failed");
      console.error(err);
      window.runScript(`print(${JSON.stringify(String(err))})`);
    }
  }
  enableInputs(true);
}

/** @param {boolean} enabled */
function enableInputs(enabled) {
  for (const input of fileList.querySelectorAll("input")) {
    input.disabled = !enabled;
  }
  assignmentPicker.disabled = !enabled;
}

function getCurrentAssignment() {
  return assignments[assignmentPicker.value];
}

export {};
