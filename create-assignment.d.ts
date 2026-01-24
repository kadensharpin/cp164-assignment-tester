import { Assignments } from "./index";

export type Action = (
  assignments: Assignments,
  args: string[],
) => Promise<void>;
