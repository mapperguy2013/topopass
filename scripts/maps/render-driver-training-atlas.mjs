import { execFile } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createMapProjection } from "./map-projection.mjs";
import {
  classifyRoadAccess,
  isPubliclyDrivable,
  roadAccessClasses
} from "./road-access.mjs";

const execFileAsync = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const outputDirectory = path.join(projectRoot, "public/maps/generated");
const sourceMapPath = path.join(
  projectRoot,
  "public/maps/kings-cross-euston/osm-raw.geojson"
);
const configPath = path.join(
  projectRoot,
  "src/data/maps/kings-cross-euston/map-config.json"
);
const svgOutputPath = path.join(
  outputDirectory,
  "kings-cross-euston-driver-training-atlas.svg"
);
const pngOutputPath = path.join(
  outputDirectory,
  "kings-cross-euston-driver-training-atlas.png"
);
const reportOutputPath = path.join(
  outputDirectory,
  "kings-cross-euston-driver-training-atlas.report.json"
);

const rawMap = JSON.parse(await readFile(sourceMapPath, "utf8"));
const baseConfig = JSON.parse(await readFile(configPath, "utf8"));

if (rawMap.type !== "FeatureCollection" || rawMap.features.length === 0) {
  throw new Error("osm-raw.geojson is invalid or empty.");
}

const config = {
  ...baseConfig,
  width: 2400,
  height: 1600,
  padding: 38
};
const { width, height } = config;
const project = createMapProjection(config);

function collectCoordinates(value, output = []) {
  if (!Array.isArray(value)) return output;
  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    output.push([value[0], value[1]]);
    return output;
  }
  value.forEach((child) => collectCoordinates(child, output));
  return output;
}

function featureBounds(feature) {
  const coordinates = collectCoordinates(feature.geometry?.coordinates);
  if (coordinates.length === 0) return null;

  return coordinates.reduce(
    (bounds, [longitude, latitude]) => ({
      west: Math.min(bounds.west, longitude),
      south: Math.min(bounds.south, latitude),
      east: Math.max(bounds.east, longitude),
      north: Math.max(bounds.north, latitude)
    }),
    {
      west: Number.POSITIVE_INFINITY,
      south: Number.POSITIVE_INFINITY,
      east: Number.NEGATIVE_INFINITY,
      north: Number.NEGATIVE_INFINITY
    }
  );
}

function expandBounds(bounds, bufferDegrees) {
  return {
    west: bounds.west - bufferDegrees,
    south: bounds.south - bufferDegrees,
    east: bounds.east + bufferDegrees,
    north: bounds.north + bufferDegrees
  };
}

function boundsIntersect(a, b) {
  return !(
    a.east < b.west ||
    a.west > b.east ||
    a.north < b.south ||
    a.south > b.north
  );
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatPoint(point) {
  return point.map((value) => value.toFixed(1)).join(" ");
}

function geometryLines(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function linePath(coordinates) {
  return coordinates
    .map((coordinate, index) => {
      const [x, y] = project(coordinate);
      return `${index === 0 ? "M" : "L"}${formatPoint([x, y])}`;
    })
    .join(" ");
}

function polygonPath(feature) {
  return geometryLines(feature.geometry)
    .map((coordinates) => `${linePath(coordinates)} Z`)
    .join(" ");
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function projectedLength(points) {
  return points
    .slice(1)
    .reduce((sum, point, index) => sum + distance(points[index], point), 0);
}

function pointAlongLine(points, targetDistance) {
  let traversed = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = distance(start, end);

    if (segmentLength === 0) continue;

    if (traversed + segmentLength >= targetDistance) {
      const progress = (targetDistance - traversed) / segmentLength;
      return {
        point: [
          start[0] + (end[0] - start[0]) * progress,
          start[1] + (end[1] - start[1]) * progress
        ],
        angle: (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI
      };
    }

    traversed += segmentLength;
  }

  return null;
}

const renderBounds = expandBounds(
  config.bounds,
  config.renderBufferDegrees ?? 0.006
);
const renderedFeatures = rawMap.features.filter((feature) => {
  const bounds = featureBounds(feature);
  return bounds ? boundsIntersect(bounds, renderBounds) : false;
});

const datasets = {
  roads: renderedFeatures.filter(
    (feature) =>
      /LineString/.test(feature.geometry?.type ?? "") &&
      Boolean(feature.properties?.highway)
  ),
  buildings: renderedFeatures.filter(
    (feature) =>
      /Polygon/.test(feature.geometry?.type ?? "") &&
      Boolean(feature.properties?.building)
  ),
  parks: renderedFeatures.filter((feature) => {
    const properties = feature.properties ?? {};
    return (
      /Polygon/.test(feature.geometry?.type ?? "") &&
      (properties.leisure === "park" ||
        properties.leisure === "garden" ||
        ["recreation_ground", "village_green"].includes(properties.landuse))
    );
  }),
  water: renderedFeatures.filter((feature) => {
    const properties = feature.properties ?? {};
    return (
      properties.natural === "water" ||
      ["canal", "river", "stream"].includes(properties.waterway)
    );
  }),
  railLines: renderedFeatures.filter((feature) => {
    const properties = feature.properties ?? {};
    return (
      /LineString/.test(feature.geometry?.type ?? "") &&
      ["rail", "subway", "light_rail", "narrow_gauge"].includes(
        properties.railway
      )
    );
  }),
  stationAreas: renderedFeatures.filter((feature) => {
    const properties = feature.properties ?? {};
    return (
      /Polygon/.test(feature.geometry?.type ?? "") &&
      (properties.railway === "station" ||
        properties.railway === "platform" ||
        properties.landuse === "railway")
    );
  }),
  stations: renderedFeatures.filter(
    (feature) =>
      feature.geometry?.type === "Point" &&
      feature.properties?.railway === "station"
  ),
  landmarks: renderedFeatures.filter((feature) => {
    const properties = feature.properties ?? {};
    if (!properties.name || properties.shop || properties.cuisine) return false;

    return (
      [
        "hospital",
        "school",
        "university",
        "college",
        "library",
        "courthouse",
        "townhall",
        "police",
        "fire_station"
      ].includes(properties.amenity) ||
      ["hospital", "school", "university", "civic", "public"].includes(
        properties.building
      ) ||
      ["museum", "attraction"].includes(properties.tourism) ||
      properties.place === "square" ||
      Boolean(properties.historic)
    );
  })
};

function roadClass(feature) {
  const properties = feature.properties ?? {};
  const highway = String(properties.highway ?? "");
  const ref = String(properties.ref ?? "");

  if (/^A\d+/i.test(ref) || /^(motorway|trunk|trunk_link|primary|primary_link)$/.test(highway)) {
    return "a-road";
  }
  if (/^B\d+/i.test(ref) || /^(secondary|secondary_link)$/.test(highway)) {
    return "b-road";
  }
  if (/^(tertiary|tertiary_link)$/.test(highway)) return "tertiary";
  if (/^(residential|unclassified|living_street)$/.test(highway)) return "local";
  if (/^(service|track)$/.test(highway)) return "service";
  if (/^(pedestrian|footway|path|steps|cycleway|platform)$/.test(highway)) {
    return "pedestrian";
  }
  return "minor";
}

const roadStyles = {
  "a-road": {
    casing: 26,
    fill: 18,
    casingColour: "#27221b",
    fillColour: "#f2ae2e"
  },
  "b-road": {
    casing: 18,
    fill: 12.2,
    casingColour: "#493f32",
    fillColour: "#ffd84f"
  },
  tertiary: {
    casing: 14,
    fill: 8.4,
    casingColour: "#756a5a",
    fillColour: "#ffe893"
  },
  local: {
    casing: 9,
    fill: 5.6,
    casingColour: "#a19788",
    fillColour: "#fffdf4"
  },
  service: {
    casing: 5.8,
    fill: 3,
    casingColour: "#b8afa0",
    fillColour: "#f7f0de"
  },
  minor: {
    casing: 5.2,
    fill: 2.6,
    casingColour: "#bcb3a4",
    fillColour: "#fbf4e4"
  }
};

function renderAreaDataset(features, className) {
  return features
    .filter((feature) => /Polygon/.test(feature.geometry?.type ?? ""))
    .map((feature) => `<path class="${className}" d="${polygonPath(feature)}"/>`)
    .join("\n");
}

function renderWaterLines() {
  return datasets.water
    .filter((feature) => /LineString/.test(feature.geometry?.type ?? ""))
    .flatMap((feature) => geometryLines(feature.geometry))
    .map((coordinates) => `<path class="water-line" d="${linePath(coordinates)}"/>`)
    .join("\n");
}

function roadDataAttributes(feature, accessClass) {
  const properties = feature.properties ?? {};
  return [
    ["name", properties.name],
    ["highway", properties.highway],
    ["ref", properties.ref],
    ["access-class", accessClass],
    ["oneway", properties.oneway],
    ["access", properties.access],
    ["vehicle", properties.vehicle],
    ["motor-vehicle", properties.motor_vehicle],
    ["motorcar", properties.motorcar]
  ]
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([name, value]) => ` data-${name}="${escapeXml(value)}"`)
    .join("");
}

function roadPathsForClass(className) {
  return datasets.roads
    .filter((feature) => roadClass(feature) === className)
    .filter((feature) => isPubliclyDrivable(classifyRoadAccess(feature.properties)))
    .flatMap((feature) => {
      const accessClass = classifyRoadAccess(feature.properties);
      return geometryLines(feature.geometry).map((coordinates) => ({
        pathData: linePath(coordinates),
        attributes: roadDataAttributes(feature, accessClass)
      }));
    });
}

function renderRoadClass(className) {
  const style = roadStyles[className];
  const paths = roadPathsForClass(className);

  return `
    <g class="roads-${className}">
      ${paths
        .map(
          ({ pathData, attributes }) =>
            `<path${attributes} class="road-casing" d="${pathData}" stroke="${style.casingColour}" stroke-width="${style.casing}"/>`
        )
        .join("\n")}
      ${paths
        .map(
          ({ pathData, attributes }) =>
            `<path${attributes} class="road-fill" d="${pathData}" stroke="${style.fillColour}" stroke-width="${style.fill}"/>`
        )
        .join("\n")}
    </g>`;
}

function renderRoads() {
  return ["minor", "service", "local", "tertiary", "b-road", "a-road"]
    .map(renderRoadClass)
    .join("\n");
}

function renderPedestrianAndPrivateRoads() {
  const groups = [
    {
      name: "pedestrian-detail",
      predicate: (feature) =>
        classifyRoadAccess(feature.properties) === roadAccessClasses.pedestrianOnly
    },
    {
      name: "private-detail",
      predicate: (feature) =>
        classifyRoadAccess(feature.properties) === roadAccessClasses.serviceOrPrivate
    },
    {
      name: "unknown-detail",
      predicate: (feature) =>
        classifyRoadAccess(feature.properties) === roadAccessClasses.unknown
    }
  ];

  return groups
    .map(({ name, predicate }) => {
      const paths = datasets.roads
        .filter(predicate)
        .flatMap((feature) =>
          geometryLines(feature.geometry).map(
            (coordinates) => `<path d="${linePath(coordinates)}"/>`
          )
        );
      return `<g class="${name}">${paths.join("\n")}</g>`;
    })
    .join("\n");
}

function renderNoEntryRoads() {
  const noEntryFeatures = datasets.roads.filter(
    (feature) =>
      classifyRoadAccess(feature.properties) === roadAccessClasses.noMotorVehicle
  );
  const lines = noEntryFeatures
    .flatMap((feature) =>
      geometryLines(feature.geometry).map(
        (coordinates) =>
          `<path class="no-entry-line" d="${linePath(coordinates)}"/>`
      )
    )
    .join("\n");
  const markers = noEntryFeatures
    .flatMap((feature) =>
      geometryLines(feature.geometry).flatMap((coordinates) => {
        const points = coordinates.map(project);
        const totalLength = projectedLength(points);
        if (totalLength < 24) return [];

        const markerCount = Math.min(4, Math.max(1, Math.floor(totalLength / 90)));
        return Array.from({ length: markerCount }, (_, index) =>
          pointAlongLine(points, (totalLength * (index + 1)) / (markerCount + 1))
        )
          .filter(Boolean)
          .map(({ point }) => {
            const [x, y] = point;
            return `<g class="no-entry-marker" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="12"/><path d="M-7 0H7"/></g>`;
          });
      })
    )
    .join("\n");

  return `<g id="no-entry-roads">${lines}${markers}</g>`;
}

function renderOneWayArrows() {
  return datasets.roads
    .flatMap((feature) => {
      const accessClass = classifyRoadAccess(feature.properties);
      if (
        accessClass !== roadAccessClasses.driveOneWayForward &&
        accessClass !== roadAccessClasses.driveOneWayReverse
      ) {
        return [];
      }

      return geometryLines(feature.geometry).flatMap((coordinates) => {
        const points = coordinates.map(project);
        if (accessClass === roadAccessClasses.driveOneWayReverse) points.reverse();
        const totalLength = projectedLength(points);
        if (totalLength < 46) return [];

        const className = roadClass(feature);
        const spacing = className === "a-road" ? 150 : className === "b-road" ? 125 : 105;
        const arrowCount = Math.min(5, Math.max(1, Math.floor(totalLength / spacing)));

        return Array.from({ length: arrowCount }, (_, index) =>
          pointAlongLine(points, (totalLength * (index + 1)) / (arrowCount + 1))
        )
          .filter(Boolean)
          .map(({ point, angle }) => {
            const [x, y] = point;
            return `<g class="one-way-arrow one-way-${className}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})"><path d="M-24 0H22M12-8L22 0L12 8"/></g>`;
          });
      });
    })
    .join("\n");
}

function renderRefShields() {
  const candidates = datasets.roads
    .filter((feature) => feature.properties?.ref)
    .flatMap((feature) =>
      geometryLines(feature.geometry).flatMap((coordinates) => {
        const points = coordinates.map(project);
        const totalLength = projectedLength(points);
        if (totalLength < 62) return [];

        const className = roadClass(feature);
        const shieldCount = className === "a-road" ? Math.min(4, Math.max(1, Math.floor(totalLength / 190))) : 1;
        return Array.from({ length: shieldCount }, (_, index) =>
          pointAlongLine(points, (totalLength * (index + 1)) / (shieldCount + 1))
        )
          .filter(Boolean)
          .map(({ point, angle }) => ({
            ref: feature.properties.ref,
            className,
            point,
            angle
          }));
      })
    );
  const placed = [];

  for (const candidate of candidates) {
    const tooClose = placed.some(
      (label) => distance(label.point, candidate.point) < 86
    );
    if (!tooClose) placed.push(candidate);
  }

  return placed
    .slice(0, 115)
    .map(({ ref, className, point, angle }) => {
      const [x, y] = point;
      const label = String(ref).toUpperCase();
      const shieldWidth = Math.max(36, label.length * 9.4);
      const shieldClass = className === "a-road" ? "shield-a" : "shield-b";
      const readableAngle = angle > 90 || angle < -90 ? angle + 180 : angle;

      return `<g class="road-shield ${shieldClass}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${readableAngle.toFixed(1)})"><rect x="${(-shieldWidth / 2).toFixed(1)}" y="-10" width="${shieldWidth.toFixed(1)}" height="20" rx="2"/><text y="4" text-anchor="middle">${escapeXml(label)}</text></g>`;
    })
    .join("\n");
}

function segmentLabelCandidates(feature) {
  const properties = feature.properties ?? {};
  const name = properties.name;
  if (!name || !isPubliclyDrivable(classifyRoadAccess(properties))) return [];

  const className = roadClass(feature);
  const minimumLength = {
    "a-road": 64,
    "b-road": 54,
    tertiary: 43,
    local: 31,
    service: 34,
    minor: 34
  }[className] ?? 35;
  const candidateName =
    properties.ref && !String(name).includes(properties.ref)
      ? `${name}`
      : name;

  return geometryLines(feature.geometry).flatMap((coordinates) => {
    const projected = coordinates.map(project);
    const candidates = [];

    for (let index = 1; index < projected.length; index += 1) {
      const start = projected[index - 1];
      const end = projected[index];
      const length = distance(start, end);
      if (length < minimumLength) continue;

      const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      let angle = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI;
      if (angle > 90 || angle < -90) angle += 180;

      candidates.push({
        name: String(candidateName).toUpperCase(),
        className,
        midpoint,
        angle,
        length
      });
    }

    return candidates;
  });
}

function renderRoadLabels() {
  const candidates = datasets.roads
    .flatMap(segmentLabelCandidates)
    .sort((a, b) => {
      const rank = {
        "a-road": 6,
        "b-road": 5,
        tertiary: 4,
        local: 3,
        service: 2,
        minor: 1
      };
      return rank[b.className] - rank[a.className] || b.length - a.length;
    });
  const placed = [];
  const nameCounts = new Map();
  const maxLabels = 760;

  for (const candidate of candidates) {
    const currentCount = nameCounts.get(candidate.name) ?? 0;
    const allowedRepeats =
      candidate.className === "a-road"
        ? 7
        : candidate.className === "b-road" || candidate.className === "tertiary"
          ? 4
          : 2;
    if (currentCount >= allowedRepeats) continue;

    const collisionDistance = {
      "a-road": 72,
      "b-road": 60,
      tertiary: 50,
      local: 38,
      service: 31,
      minor: 31
    }[candidate.className];
    const collides = placed.some(
      (label) => distance(label.midpoint, candidate.midpoint) < collisionDistance
    );
    if (collides) continue;

    placed.push(candidate);
    nameCounts.set(candidate.name, currentCount + 1);
    if (placed.length >= maxLabels) break;
  }

  return placed
    .map((label) => {
      const [x, y] = label.midpoint;
      return `<text class="road-label road-label-${label.className}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" transform="rotate(${label.angle.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${escapeXml(label.name)}</text>`;
    })
    .join("\n");
}

function featureCentre(feature) {
  if (feature.geometry?.type === "Point") return project(feature.geometry.coordinates);
  const points = geometryLines(feature.geometry).flat().map(project);
  if (points.length === 0) return null;

  return points
    .reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / points.length);
}

function renderAreaLabels(features, className, options = {}) {
  const { minimumArea = 0, maximumLabels = 30 } = options;
  const seen = new Set();

  return features
    .filter((feature) => feature.properties?.name && feature.geometry)
    .map((feature) => {
      const name = feature.properties.name;
      if (seen.has(name)) return null;
      seen.add(name);
      const points = geometryLines(feature.geometry).flat().map(project);
      if (points.length === 0) return null;
      const xValues = points.map((point) => point[0]);
      const yValues = points.map((point) => point[1]);
      const area =
        (Math.max(...xValues) - Math.min(...xValues)) *
        (Math.max(...yValues) - Math.min(...yValues));
      const centre = featureCentre(feature);
      return { name, centre, area };
    })
    .filter((label) => label && label.area >= minimumArea)
    .sort((a, b) => b.area - a.area)
    .slice(0, maximumLabels)
    .map(
      ({ name, centre }) =>
        `<text class="${className}" x="${centre[0].toFixed(1)}" y="${centre[1].toFixed(1)}" text-anchor="middle">${escapeXml(String(name).toUpperCase())}</text>`
    )
    .join("\n");
}

function landmarkRank(properties) {
  if (properties.name === "British Library") return 100;
  if (properties.amenity === "hospital" || properties.building === "hospital") {
    return 90;
  }
  if (["university", "college", "library"].includes(properties.amenity)) {
    return 82;
  }
  if (["museum", "attraction"].includes(properties.tourism)) return 74;
  if (properties.place === "square") return 62;
  if (["school", "courthouse", "townhall", "police"].includes(properties.amenity)) {
    return 52;
  }
  return 30;
}

function renderLandmarks() {
  const placed = [];
  const seen = new Set();
  const candidates = datasets.landmarks
    .map((feature) => ({
      name: feature.properties.name,
      centre: featureCentre(feature),
      rank: landmarkRank(feature.properties)
    }))
    .filter((candidate) => candidate.centre)
    .sort((a, b) => b.rank - a.rank);

  for (const candidate of candidates) {
    if (seen.has(candidate.name)) continue;
    if (placed.some((label) => distance(label.centre, candidate.centre) < 95)) {
      continue;
    }
    seen.add(candidate.name);
    placed.push(candidate);
    if (placed.length >= 18) break;
  }

  return placed
    .map(
      ({ name, centre }) =>
        `<text class="landmark-label" x="${centre[0].toFixed(1)}" y="${centre[1].toFixed(1)}" text-anchor="middle">${escapeXml(String(name).toUpperCase())}</text>`
    )
    .join("\n");
}

function renderRailLines() {
  return datasets.railLines
    .map((feature) => {
      const railway = feature.properties?.railway;
      const className = railway === "subway" ? "rail-subway" : "rail-surface";
      return geometryLines(feature.geometry)
        .map(
          (coordinates) =>
            `<path class="${className}" d="${linePath(coordinates)}"/>`
        )
        .join("\n");
    })
    .join("\n");
}

function renderStations() {
  const seen = new Set();
  const displayNames = new Map([
    ["London Euston", "EUSTON"],
    ["London King's Cross", "KING'S CROSS"],
    ["London St. Pancras International", "ST PANCRAS INTL"]
  ]);

  return datasets.stations
    .filter((feature) => feature.geometry?.type === "Point")
    .map((feature) => {
      const name = feature.properties?.name;
      if (!name) return "";
      const key = name.toLowerCase();
      if (seen.has(key)) return "";
      seen.add(key);
      const [x, y] = project(feature.geometry.coordinates);
      const stationType =
        feature.properties?.station === "subway"
          ? "subway"
          : /overground/i.test(
                `${feature.properties?.network ?? ""} ${feature.properties?.operator ?? ""}`
              )
            ? "overground"
            : "rail";
      return `
        <g class="station station-${stationType}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
          <circle cx="0" cy="0" r="7.2"/>
          <text x="12" y="4" text-anchor="start">${escapeXml(
            displayNames.get(name) ?? String(name).toUpperCase()
          )}</text>
        </g>`;
    })
    .join("\n");
}

function renderGrid() {
  const vertical = [];
  const horizontal = [];
  for (let x = 200; x < width; x += 200) {
    vertical.push(`<path d="M${x} 0V${height}"/>`);
  }
  for (let y = 200; y < height; y += 200) {
    horizontal.push(`<path d="M0 ${y}H${width}"/>`);
  }
  return `<g class="atlas-grid">${vertical.join("\n")}${horizontal.join("\n")}</g>`;
}

function findChromeExecutable() {
  const candidates = [
    path.join(
      process.env.ProgramFiles ?? "C:\\Program Files",
      "Google/Chrome/Application/chrome.exe"
    ),
    path.join(
      process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
      "Google/Chrome/Application/chrome.exe"
    ),
    path.join(
      process.env.ProgramFiles ?? "C:\\Program Files",
      "Microsoft/Edge/Application/msedge.exe"
    ),
    path.join(
      process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
      "Microsoft/Edge/Application/msedge.exe"
    )
  ];

  return candidates;
}

async function renderPngWithChrome() {
  for (const candidate of findChromeExecutable()) {
    try {
      await stat(candidate);
    } catch {
      continue;
    }

    await execFileAsync(candidate, [
      "--headless",
      "--disable-gpu",
      "--disable-gpu-compositing",
      "--disable-software-rasterizer",
      "--disable-features=VizDisplayCompositor",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--hide-scrollbars",
      `--window-size=${width},${height}`,
      `--screenshot=${pngOutputPath}`,
      pathToFileURL(svgOutputPath).href
    ]);

    return candidate;
  }

  return null;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Cleanroom London driver training atlas concept for King's Cross and Euston</title>
  <description id="description">A dense printed street-atlas style map generated from local OpenStreetMap GeoJSON for TopoPass driver training review.</description>
  <style>
    .atlas-grid path { fill: none; stroke: #dccfb1; stroke-width: .7; opacity: .38; }
    .building { fill: #e6dcc8; stroke: #c8bea8; stroke-width: .72; }
    .park { fill: #cfe2b7; stroke: #93a97a; stroke-width: 1.15; }
    .station-area { fill: #d4cec1; stroke: #9e9585; stroke-width: 1.15; }
    .water-area { fill: #b7d9e6; stroke: #7aacbc; stroke-width: 1.15; }
    .water-line { fill: none; stroke: #91c6d6; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }
    .rail-surface { fill: none; stroke: #504d47; stroke-width: 2.1; stroke-linecap: round; opacity: .74; }
    .rail-subway { fill: none; stroke: #8a8479; stroke-width: 1.35; stroke-dasharray: 8 6; opacity: .58; }
    .pedestrian-detail path { fill: none; stroke: #b9b09f; stroke-width: 1.2; stroke-dasharray: 2 4; opacity: .44; }
    .private-detail path { fill: none; stroke: #746d61; stroke-width: 2.2; stroke-dasharray: 9 5; opacity: .62; }
    .unknown-detail path { fill: none; stroke: #c9bea8; stroke-width: 1; stroke-dasharray: 2 5; opacity: .36; }
    .road-casing, .road-fill { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .roads-service .road-fill { stroke-dasharray: 18 5; }
    .no-entry-line { fill: none; stroke: #b71e24; stroke-width: 8.8; stroke-linecap: round; stroke-linejoin: round; opacity: .94; }
    .no-entry-marker circle { fill: #bd1f28; stroke: #fffdf4; stroke-width: 2.5; }
    .no-entry-marker path { fill: none; stroke: #fffdf4; stroke-width: 3.6; stroke-linecap: round; }
    .one-way-arrow path { fill: none; stroke: #e8a7bc; stroke-width: 4.2; stroke-linecap: round; stroke-linejoin: round; opacity: .86; }
    .one-way-a-road path { stroke-width: 5; opacity: .9; }
    .road-label { fill: #27231d; font-family: Arial Narrow, Arial, Helvetica, sans-serif; font-weight: 700; letter-spacing: .16px; paint-order: stroke; stroke: #fbf1d8; stroke-width: 3.2px; stroke-linejoin: round; }
    .road-label-a-road { fill: #111; font-size: 17px; font-weight: 900; letter-spacing: .32px; stroke-width: 4px; }
    .road-label-b-road { fill: #17140f; font-size: 13.2px; font-weight: 900; stroke-width: 3.8px; }
    .road-label-tertiary { fill: #232018; font-size: 11.2px; font-weight: 800; }
    .road-label-local { fill: #39352d; font-size: 9.2px; font-weight: 700; }
    .road-label-service, .road-label-minor { fill: #514b40; font-size: 7.6px; font-weight: 700; stroke-width: 2.6px; }
    .road-shield rect { stroke-width: 2; }
    .road-shield text { font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 900; letter-spacing: .2px; }
    .shield-a rect { fill: #ffe24a; stroke: #be211e; }
    .shield-a text { fill: #be211e; }
    .shield-b rect { fill: #fff4a9; stroke: #504126; }
    .shield-b text { fill: #3c321f; }
    .area-label { fill: #4c6548; font-family: Georgia, serif; font-size: 14px; font-style: italic; font-weight: 700; letter-spacing: 1.2px; paint-order: stroke; stroke: #dfeccd; stroke-width: 3px; }
    .water-label { fill: #426f7d; font-family: Georgia, serif; font-size: 13px; font-style: italic; font-weight: 700; letter-spacing: 1px; paint-order: stroke; stroke: #d9ecf1; stroke-width: 3px; }
    .landmark-label { fill: #4c3249; font-family: Georgia, serif; font-size: 11.5px; font-weight: 900; letter-spacing: .55px; paint-order: stroke; stroke: #fbf1d8; stroke-width: 4px; stroke-linejoin: round; }
    .station circle { fill: #1f6281; stroke: #fffdf4; stroke-width: 3; }
    .station-subway circle { fill: #8d2f49; }
    .station-overground circle { fill: #805f20; }
    .station text { fill: #191713; font-family: Arial Narrow, Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 900; letter-spacing: .45px; paint-order: stroke; stroke: #fbf1d8; stroke-width: 4px; stroke-linejoin: round; }
    .page-title { fill: #28241d; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 900; letter-spacing: .7px; }
    .page-note { fill: #5f5748; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; }
  </style>
  <rect width="${width}" height="${height}" fill="#f5ebd0"/>
  ${renderGrid()}
  <g id="buildings">${renderAreaDataset(datasets.buildings, "building")}</g>
  <g id="parks">${renderAreaDataset(datasets.parks, "park")}</g>
  <g id="station-areas">${renderAreaDataset(datasets.stationAreas, "station-area")}</g>
  <g id="water-areas">${renderAreaDataset(datasets.water, "water-area")}</g>
  <g id="water-lines">${renderWaterLines()}</g>
  <g id="rail-lines">${renderRailLines()}</g>
  <g id="pedestrian-private">${renderPedestrianAndPrivateRoads()}</g>
  <g id="roads">${renderRoads()}</g>
  <g id="one-way-arrows">${renderOneWayArrows()}</g>
  ${renderNoEntryRoads()}
  <g id="road-shields">${renderRefShields()}</g>
  <g id="road-labels">${renderRoadLabels()}</g>
  <g id="park-labels">${renderAreaLabels(datasets.parks, "area-label", { minimumArea: 2200, maximumLabels: 24 })}</g>
  <g id="water-labels">${renderAreaLabels(datasets.water, "water-label", { minimumArea: 500, maximumLabels: 10 })}</g>
  <g id="landmarks">${renderLandmarks()}</g>
  <g id="stations">${renderStations()}</g>
  <rect x="14" y="14" width="${width - 28}" height="${height - 28}" fill="none" stroke="#6e6658" stroke-width="2.2"/>
  <rect x="18" y="18" width="${width - 36}" height="30" fill="#f5ebd0" opacity=".94"/>
  <rect x="18" y="${height - 42}" width="${width - 36}" height="24" fill="#f5ebd0" opacity=".9"/>
  <text class="page-title" x="28" y="35">LONDON DRIVER TRAINING ATLAS - KING'S CROSS / EUSTON CLEANROOM CONCEPT</text>
  <text class="page-note" x="28" y="${height - 24}">${escapeXml(config.attribution)} - Generated from local osm-raw.geojson - Not A-Z artwork</text>
</svg>
`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(svgOutputPath, svg, "utf8");

let pngRenderer = null;
try {
  pngRenderer = await renderPngWithChrome();
} catch (error) {
  console.warn(
    `SVG generated, but PNG export failed: ${error instanceof Error ? error.message : error}`
  );
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceData: path.relative(projectRoot, sourceMapPath).replaceAll("\\", "/"),
  extraData: [],
  outputs: {
    svg: path.relative(projectRoot, svgOutputPath).replaceAll("\\", "/"),
    png: pngRenderer
      ? path.relative(projectRoot, pngOutputPath).replaceAll("\\", "/")
      : null
  },
  renderer: {
    svg: "scripts/maps/render-driver-training-atlas.mjs",
    png: pngRenderer
      ? `Headless Chromium export via ${pngRenderer}`
      : "Not generated; no browser renderer available or export failed"
  },
  counts: {
    sourceFeatures: rawMap.features.length,
    renderedFeatures: renderedFeatures.length,
    roads: datasets.roads.length,
    buildings: datasets.buildings.length,
    stations: datasets.stations.length,
    oneWayRoads: datasets.roads.filter((feature) =>
      [
        roadAccessClasses.driveOneWayForward,
        roadAccessClasses.driveOneWayReverse
      ].includes(classifyRoadAccess(feature.properties))
    ).length,
    noMotorVehicleRoads: datasets.roads.filter(
      (feature) =>
        classifyRoadAccess(feature.properties) ===
        roadAccessClasses.noMotorVehicle
    ).length
  },
  styleNotes: {
    cleanroom: "Original TopoPass driver-training atlas treatment; example references used for high-level reading goals only.",
    majorRoads: "OSM A-road refs and trunk/primary roads render with thick dark casing, orange fill, large road labels, and route shields.",
    bRoads: "OSM B-road refs and secondary roads render with strong yellow fill and route shields.",
    minorRoads: "Residential, unclassified, service, and minor roads remain thin but named where source labels and collision rules allow.",
    oneWay: "One-way roads use long light-pink directional arrows following OSM oneway and roundabout direction logic.",
    noEntry: "Explicit access/vehicle/motor_vehicle/motorcar=no roads use thick red overlays and no-entry bar markers."
  }
};

await writeFile(reportOutputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `Generated ${report.outputs.svg}` +
    (report.outputs.png ? ` and ${report.outputs.png}` : "")
);
console.log(
  `Rendered ${report.counts.roads} roads, ${report.counts.oneWayRoads} one-way roads, ` +
    `${report.counts.noMotorVehicleRoads} no-entry/restricted roads from local OSM data.`
);
