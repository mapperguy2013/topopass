import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const mockTestFlowSource = readFileSync(
  path.join(process.cwd(), "src/components/mock-test/MockTestFlow.tsx"),
  "utf8"
);
const appShellSource = readFileSync(
  path.join(process.cwd(), "components/layout/AppShell.tsx"),
  "utf8"
);
const globalsSource = readFileSync(
  path.join(process.cwd(), "app/globals.css"),
  "utf8"
);
const mockTestPageSource = readFileSync(
  path.join(process.cwd(), "app/mock-test/page.tsx"),
  "utf8"
);

test("active mock exam flag control stays near the question navigator", () => {
  assert.match(
    mockTestFlowSource,
    /aria-label=\{\s*currentQuestionFlagged\s*\?\s*"Remove flag from this question"\s*:\s*"Flag this question"\s*\}/
  );
  assert.match(
    mockTestFlowSource,
    /<FlagIcon active=\{currentQuestionFlagged\} \/>/
  );
  assert.match(
    mockTestFlowSource,
    /toggleQuestionFlag\(currentQuestion\.id\)/
  );
});

test("active mock exam omits restart, change mode, and the visible navigator legend", () => {
  assert.doesNotMatch(mockTestFlowSource, />Restart exam</);
  assert.doesNotMatch(mockTestFlowSource, />Change mode</);
  assert.doesNotMatch(mockTestFlowSource, /Outlined: unanswered/);
  assert.doesNotMatch(mockTestFlowSource, /Dark: answered/);
  assert.doesNotMatch(mockTestFlowSource, /Blue: current/);
  assert.doesNotMatch(mockTestFlowSource, /Amber dot: flagged/);
});

test("active mock exam toggles focused layout without removing the app shell globally", () => {
  assert.match(
    mockTestFlowSource,
    /document\.body\.classList\.toggle\("mock-exam-focused", focused\)/
  );
  assert.match(
    mockTestFlowSource,
    /document\.body\.classList\.remove\("mock-exam-focused"\)/
  );
  assert.match(appShellSource, /data-app-sidebar/);
  assert.match(appShellSource, /data-app-shell-frame/);
  assert.match(
    globalsSource,
    /body\.mock-exam-focused \[data-app-sidebar\]\s*\{\s*display: none;/
  );
  assert.match(mockTestPageSource, /<AppShell title="Mock Test">/);
});
