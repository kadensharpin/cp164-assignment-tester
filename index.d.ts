export type Task = {
  number: number;
  name: string;
  code: string;
};

export type Assignment = {
  files: string[];
  tasks: Task[];
};

export type Assignments = {
  assignments: Record<string, Assignment>;
  modules: Record<string, string>;
  files: Record<string, string>;
};

declare global {
  interface Window {
    scriptRunDelay: number;

    onPythonReady(): void;
    createFile(filename: string, code: string): void;
    clearTerminal(): void;
    runScript(code: string): void;
  }
}
