import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const pixelTolerance = Number(process.env.PHASE8_VISUAL_PIXEL_TOLERANCE ?? "25");
const channelSumTolerance = Number(process.env.PHASE8_VISUAL_CHANNEL_SUM_TOLERANCE ?? "4");

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
  const firstBytes = await readFile(path.join(firstDirectory, fileName));
  const secondBytes = await readFile(path.join(secondDirectory, fileName));
  const firstHash = sha256(firstBytes);
  const secondHash = sha256(secondBytes);
  const pixelComparison = firstHash === secondHash || pixelTolerance <= 0
    ? null
    : comparePngPixels(firstBytes, secondBytes);
  const pixelEquivalent = pixelComparison
    ? pixelComparison.differingPixels <= pixelTolerance && pixelComparison.maxChannelSum <= channelSumTolerance
    : false;

  comparisons.push({
    fileName,
    firstHash,
    secondHash,
    equivalent: firstHash === secondHash || pixelEquivalent,
    exactHashMatch: firstHash === secondHash,
    ...(pixelComparison ? { pixelComparison } : {})
  });
}

const differences = comparisons.filter((comparison) => !comparison.equivalent);
const result = {
  equivalent: differences.length === 0,
  comparison: "byte-identical screenshot SHA-256 with tiny PNG pixel tolerance for browser antialias variance",
  tolerance: {
    differingPixels: pixelTolerance,
    maxChannelSum: channelSumTolerance
  },
  fixtureCount: firstFiles.length,
  comparisons
};

console.log(JSON.stringify(result, null, 2));

if (differences.length > 0) {
  process.exitCode = 1;
}

function comparePngPixels(firstBytes, secondBytes) {
  const first = decodePng(firstBytes);
  const second = decodePng(secondBytes);

  if (first.width !== second.width || first.height !== second.height) {
    return {
      equivalentDimensions: false,
      firstDimensions: [first.width, first.height],
      secondDimensions: [second.width, second.height],
      differingPixels: Number.POSITIVE_INFINITY,
      maxChannelSum: Number.POSITIVE_INFINITY
    };
  }

  let differingPixels = 0;
  let maxChannelSum = 0;
  for (let index = 0; index < first.rgba.length; index += 4) {
    const channelSum =
      Math.abs(first.rgba[index] - second.rgba[index]) +
      Math.abs(first.rgba[index + 1] - second.rgba[index + 1]) +
      Math.abs(first.rgba[index + 2] - second.rgba[index + 2]) +
      Math.abs(first.rgba[index + 3] - second.rgba[index + 3]);
    if (channelSum > 0) {
      differingPixels += 1;
      maxChannelSum = Math.max(maxChannelSum, channelSum);
    }
  }

  return {
    equivalentDimensions: true,
    width: first.width,
    height: first.height,
    differingPixels,
    maxChannelSum
  };
}

function decodePng(bytes) {
  const pngSignature = "89504e470d0a1a0a";
  if (bytes.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("Only PNG screenshots can be pixel-compared.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      const interlaceMethod = data[12];
      if (bitDepth !== 8 || interlaceMethod !== 0 || ![2, 6].includes(colorType)) {
        throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlaceMethod}`);
      }
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const stride = width * bytesPerPixel;
  const raw = Buffer.alloc(height * stride);
  let inputOffset = 0;
  let outputOffset = 0;

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const rowBytes = inflated.subarray(inputOffset, inputOffset + stride);
    inputOffset += stride;
    unfilterRow(filter, rowBytes, raw, outputOffset, stride, bytesPerPixel);
    outputOffset += stride;
  }

  const rgba = Buffer.alloc(width * height * 4);
  if (colorType === 6) {
    raw.copy(rgba);
  } else {
    for (let rawIndex = 0, rgbaIndex = 0; rawIndex < raw.length; rawIndex += 3, rgbaIndex += 4) {
      rgba[rgbaIndex] = raw[rawIndex];
      rgba[rgbaIndex + 1] = raw[rawIndex + 1];
      rgba[rgbaIndex + 2] = raw[rawIndex + 2];
      rgba[rgbaIndex + 3] = 255;
    }
  }

  return { width, height, rgba };
}

function unfilterRow(filter, rowBytes, output, outputOffset, stride, bytesPerPixel) {
  for (let index = 0; index < stride; index += 1) {
    const left = index >= bytesPerPixel ? output[outputOffset + index - bytesPerPixel] : 0;
    const up = outputOffset >= stride ? output[outputOffset + index - stride] : 0;
    const upLeft = outputOffset >= stride && index >= bytesPerPixel
      ? output[outputOffset + index - stride - bytesPerPixel]
      : 0;
    const value = rowBytes[index];

    if (filter === 0) {
      output[outputOffset + index] = value;
    } else if (filter === 1) {
      output[outputOffset + index] = (value + left) & 0xff;
    } else if (filter === 2) {
      output[outputOffset + index] = (value + up) & 0xff;
    } else if (filter === 3) {
      output[outputOffset + index] = (value + Math.floor((left + up) / 2)) & 0xff;
    } else if (filter === 4) {
      output[outputOffset + index] = (value + paethPredictor(left, up, upLeft)) & 0xff;
    } else {
      throw new Error(`Unsupported PNG filter type ${filter}.`);
    }
  }
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}
