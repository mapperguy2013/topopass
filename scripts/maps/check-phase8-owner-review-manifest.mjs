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
  ["stage-8-11", 8, "current-deterministic"]
];

const deterministicScreenshots = [
  ["victoria-neutral-desktop.png", "b52ab03fe47497250ccd3883bdcce1521faaaffa21cddf20316ed83b2100fd06", 1440, 900],
  ["kings-cross-correct-review-desktop.png", "15e16de5c194b055974e0c7a50e3eb4d057d36ffef172327b5d307ecffd0eafc", 1440, 900],
  ["piccadilly-active-route-desktop.png", "32e639a12f7c75c754959d9610ce29b51b04bb30411f4a74d6406c7e27c8017e", 1440, 900],
  ["one-way-restrictions-desktop.png", "1d8707958cfbbcebbd837ded1652d15230acdac0ddae3d5637de327933a37281", 1440, 900],
  ["waterloo-context-tablet.png", "ee6a25537541b1cabc0f268b703a9f0a2bf486b179116d7eeb2f9bebc749b726", 768, 1024],
  ["waterloo-incorrect-review-mobile.png", "4454e9703635e9e7ae6ffe301d752bbabcb9eaa9b96712c535068319caf729ba", 390, 844],
  ["piccadilly-hint-mobile.png", "8eec738e244f9beddaf3838c201c7a7df7b9ea748078b38b7f62d6e18399ae6e", 390, 844],
  ["quiet-residential-mobile.png", "1288bc1b4996ce55db61a60e07cc4f4f351558c4f61ee8d7f9dede333b62c4be", 390, 844]
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
    "Physical touch, orientation and safe-area checks remain manual.",
    "The Stage 8.13 closure decision depends on normal-size owner inspection as well as this manifest."
  ],
  failures
};

console.log(JSON.stringify(result, null, 2));

if (failures.length > 0) process.exitCode = 1;
