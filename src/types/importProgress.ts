export type ImportProgressLevel =
  | "info"
  | "success"
  | "skip"
  | "update"
  | "create";

export type ImportProgressEvent = {
  message: string;
  level?: ImportProgressLevel;
};

export type ImportProgressReporter = (event: ImportProgressEvent) => void;

export const noopImportProgress: ImportProgressReporter = () => {};
