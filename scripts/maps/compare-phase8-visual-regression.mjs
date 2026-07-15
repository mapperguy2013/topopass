import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

async function screenshotFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(?:jpe?g|png)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const [firstDirectory, secondDirectory] = process.argv.slice(2);

if (!firstDirectory || !secondDirectory) {
  throw new Error("Usage: node scripts/maps/compare-phase8-visual-regression.mjs <run-a> <run-b>");
}

const firstFiles = await screenshotFiles(firstDirectory);
const secondFiles = await screenshotFiles(secondDirectory);

if (JSON.stringify(firstFiles) !== JSON.stringify(secondFiles)) {
  throw new Error("Capture directories do not contain the same screenshot names.");
}

if (firstFiles.length === 0) {
  throw new Error("No screenshots were found for comparison.");
}

const comparisons = [];

for (const fileName of firstFiles) {
  const firstHash = sha256(await readFile(path.join(firstDirectory, fileName)));
  const secondHash = sha256(await readFile(path.join(secondDirectory, fileName)));

  comparisons.push({
    fileName,
    firstHash,
    secondHash,
    equivalent: firstHash === secondHash
  });
}

const differences = comparisons.filter((comparison) => !comparison.equivalent);
const result = {
  equivalent: differences.length === 0,
  comparison: "byte-identical screenshot SHA-256",
  tolerance: 0,
  fixtureCount: firstFiles.length,
  comparisons
};

console.log(JSON.stringify(result, null, 2));

if (differences.length > 0) {
  process.exitCode = 1;
}
