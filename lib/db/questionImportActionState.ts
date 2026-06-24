import type {
  QuestionImportMode,
  QuestionImportPreviewItem,
  QuestionImportValidationError
} from "./questionImportExport.ts";

export type QuestionImportActionState = {
  status: "idle" | "preview" | "committed" | "error";
  rawJson: string;
  mode: QuestionImportMode;
  validCount: number;
  invalidCount: number;
  previewItems: QuestionImportPreviewItem[];
  errors: QuestionImportValidationError[];
  message?: string;
  importedCount?: number;
};

export const initialQuestionImportState: QuestionImportActionState = {
  status: "idle",
  rawJson: "",
  mode: "create",
  validCount: 0,
  invalidCount: 0,
  previewItems: [],
  errors: []
};
