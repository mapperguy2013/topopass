import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const references = [
  {
    file: "docs/phase-8/references/phase-8-approved-exam-atlas-visual-master.png",
    sha256: "20800207f7083ca33c7e8e3875211a857b5dd2752f9cab2c7818c420502c7e43"
  },
  {
    file: "docs/phase-8/references/phase-8-approved-exam-atlas-visual-master-v2.png",
    sha256: "fe5060154a9e9672250fd49ffb8534bc214bfb7c3b124c0964c8ca5f07e1deba"
  }
];

const evidenceFolders = [
  ["stage-8-5", 10, "historical"],
  ["stage-8-5-correction", 4, "historical"],
  ["stage-8-6", 11, "historical"],
  ["stage-8-7", 16, "historical"],
  ["stage-8-7-a501-correction", 2, "historical"],
  ["stage-8-7-correction", 12, "historical"],
  ["stage-8-8", 12, "superseded"],
  ["stage-8-8-1", 20, "historical"],
  ["stage-8-8-2", 19, "current-cartography"],
  ["stage-8-9", 15, "current-overlays"],
  ["stage-8-10", 23, "current-responsive"],
  ["stage-8-11", 7, "current-deterministic"]
];

const deterministicScreenshots = [
  ["victoria-neutral-desktop.png", "b52ab03fe47497250ccd3883bdcce1521faaaffa21cddf20316ed83b2100fd06", 1440, 900],
  ["kings-cross-correct-review-desktop.png", "cf66803c53702e687fa03dbcc4b2189a4fe79df3270fa09e94c97f15a569278e", 1440, 900],
  ["piccadilly-active-route-desktop.png", "8fad206c934eb70381e3ad8a19b521da28aa81434fe1796f545d379b7221c3dd", 1440, 900],
  ["waterloo-context-tablet.png", "4c04c55dc30b34ed84e648f79831295f13b2691e820f156675c04aa5e20b3796", 768, 1024],
  ["waterloo-incorrect-review-mobile.png", "2a61e136a581efe7f747364c70d6629c88835ce84ccdfe61872895031be79efb", 390, 844],
  ["piccadilly-hint-mobile.png", "062cea1ee012159947b73a2f383cc4cf9c712d39f6b1ed14fe6f716af43d01e0", 390, 844],
  ["quiet-residential-mobile.png", "b3627869f62ad7ae0e738afad97e2c30c2906cb448e752e610b21c86b75f1c89", 390, 844]
];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Evidence file is not a valid PNG.");
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

const failures = [];
const checkedReferences = [];

for (const reference of references) {
  const bytes = await readFile(path.join(repositoryRoot, reference.file));
  const actualSha256 = digest(bytes);
  const matches = actualSha256 === reference.sha256;
  checkedReferences.push({ ...reference, actualSha256, matches });
  if (!matches) failures.push(`${reference.file} has an unexpected SHA-256.`);
}

const checkedFolders = [];

for (const [folder, expectedImageCount, status] of evidenceFolders) {
  const directory = path.join(repositoryRoot, "docs/phase-8/screenshots", folder);
  const entries = await readdir(directory, { withFileTypes: true });
  const actualImageCount = entries.filter(
    (entry) => entry.isFile() && /\.(?:jpe?g|png)$/i.test(entry.name)
  ).length;
  const matches = actualImageCount === expectedImageCount;
  checkedFolders.push({ folder, status, expectedImageCount, actualImageCount, matches });
  if (!matches) {
    failures.push(`${folder} contains ${actualImageCount} images; expected ${expectedImageCount}.`);
  }
}

const checkedDeterministicScreenshots = [];

for (const [fileName, expectedSha256, expectedWidth, expectedHeight] of deterministicScreenshots) {
  const bytes = await readFile(
    path.join(repositoryRoot, "docs/phase-8/screenshots/stage-8-11", fileName)
  );
  const actualSha256 = digest(bytes);
  const { width, height } = pngDimensions(bytes);
  const matches =
    actualSha256 === expectedSha256 && width === expectedWidth && height === expectedHeight;
  checkedDeterministicScreenshots.push({
    fileName,
    expectedSha256,
    actualSha256,
    expectedSize: `${expectedWidth}x${expectedHeight}`,
    actualSize: `${width}x${height}`,
    matches
  });
  if (!matches) failures.push(`${fileName} does not match its archived Stage 8.11 evidence.`);
}

const result = {
  valid: failures.length === 0,
  references: checkedReferences,
  evidenceFolders: checkedFolders,
  deterministicScreenshots: checkedDeterministicScreenshots,
  limitations: [
    "Stage 8.8 evidence is retained but superseded by Stage 8.8.1.",
    "Stage 8.4 independent manual visual acceptance remains pending.",
    "Physical touch, orientation and safe-area checks remain manual.",
    "Deterministic evidence does not constitute owner cartographic acceptance."
  ],
  failures
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0) process.exitCode = 1;
