import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMapProjection } from "./map-projection.mjs";
import {
  classifyRoadAccess,
  roadAccessClasses
} from "./road-access.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const dataDirectory = path.join(
  projectRoot,
  "src/data/maps/kings-cross-euston"
);
const outputDirectory = path.join(
  projectRoot,
  "public/maps/kings-cross-euston"
);
const config = JSON.parse(
  await readFile(path.join(dataDirectory, "map-config.json"), "utf8")
);

const rawMapPath = path.join(outputDirectory, "osm-raw.geojson");
const rawMap = JSON.parse(
  await readFile(rawMapPath, "utf8")
);

if (rawMap.type !== "FeatureCollection" || rawMap.features.length === 0) {
  throw new Error("Real map data not loaded yet: osm-raw.geojson is invalid or empty.");
}

const datasets = {
  roads: {
    features: rawMap.features.filter(
      (feature) =>
        feature.geometry?.type === "LineString" &&
        Boolean(feature.properties?.highway)
    )
  },
  stations: {
    features: rawMap.features.filter(
      (feature) =>
        feature.geometry?.type === "Point" &&
        feature.properties?.railway === "station"
    )
  },
  parks: {
    features: rawMap.features.filter(
      (feature) =>
        /Polygon/.test(feature.geometry?.type ?? "") &&
        (feature.properties?.leisure === "park" ||
          feature.properties?.leisure === "garden" ||
          ["recreation_ground", "village_green"].includes(
            feature.properties?.landuse
          ))
    )
  },
  water: {
    features: rawMap.features.filter(
      (feature) =>
        feature.properties?.natural === "water" ||
        ["canal", "river", "stream"].includes(feature.properties?.waterway)
    )
  },
  buildings: {
    features: rawMap.features.filter(
      (feature) =>
        /Polygon/.test(feature.geometry?.type ?? "") &&
        Boolean(feature.properties?.building)
    )
  },
  railLines: {
    features: rawMap.features.filter(
      (feature) =>
        feature.geometry?.type === "LineString" &&
        ["rail", "subway", "light_rail", "narrow_gauge"].includes(
          feature.properties?.railway
        )
    )
  },
  stationAreas: {
    features: rawMap.features.filter(
      (feature) =>
        /Polygon/.test(feature.geometry?.type ?? "") &&
        (feature.properties?.railway === "station" ||
          feature.properties?.railway === "platform" ||
          feature.properties?.landuse === "railway")
    )
  },
  landmarks: {
    features: rawMap.features.filter((feature) => {
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
          "townhall"
        ].includes(properties.amenity) ||
        ["hospital", "school", "university", "civic", "public"].includes(
          properties.building
        ) ||
        ["museum", "attraction"].includes(properties.tourism) ||
        properties.place === "square" ||
        Boolean(properties.historic)
      );
    })
  }
};

if (datasets.roads.features.length === 0 || datasets.stations.features.length === 0) {
  throw new Error("osm-raw.geojson does not contain usable roads and rail stations.");
}

const { width, height } = config;
const project = createMapProjection(config);

function formatPoint(point) {
  return point.map((value) => value.toFixed(1)).join(" ");
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
    .map((coordinate, index) => `${index === 0 ? "M" : "L"}${formatPoint(project(coordinate))}`)
    .join(" ");
}

function polygonPath(feature) {
  return geometryLines(feature.geometry)
    .map((coordinates) => `${linePath(coordinates)} Z`)
    .join(" ");
}

function roadClass(highway) {
  if (/^(motorway|trunk|primary)/.test(highway ?? "")) return "major";
  if (/^(secondary|tertiary)/.test(highway ?? "")) return "main";
  if (/^(residential|unclassified|living_street)/.test(highway ?? "")) {
    return "local";
  }
  return "minor";
}

const roadStyles = {
  major: {
    casing: 17,
    fill: 12,
    casingColour: "#706a5d",
    fillColour: "#efca68"
  },
  main: {
    casing: 10,
    fill: 7,
    casingColour: "#807d73",
    fillColour: "#fff8e6"
  },
  local: {
    casing: 6,
    fill: 3.6,
    casingColour: "#96938a",
    fillColour: "#fffef9"
  },
  minor: {
    casing: 3.4,
    fill: 1.8,
    casingColour: "#aaa69d",
    fillColour: "#fffef9"
  }
};

function renderAreaDataset(dataset, className) {
  return dataset.features
    .filter((feature) => /Polygon/.test(feature.geometry?.type ?? ""))
    .map(
      (feature) =>
        `<path class="${className}" d="${polygonPath(feature)}"/>`
    )
    .join("\n");
}

function renderWaterLines() {
  return datasets.water.features
    .filter((feature) => /LineString/.test(feature.geometry?.type ?? ""))
    .flatMap((feature) => geometryLines(feature.geometry))
    .map((coordinates) => `<path class="water-line" d="${linePath(coordinates)}"/>`)
    .join("\n");
}

function renderRoads() {
  const orderedClasses = ["minor", "local", "main", "major"];

  const normalRoads = orderedClasses
    .map((className) => {
      const style = roadStyles[className];
      const paths = datasets.roads.features
        .filter(
          (feature) =>
            roadClass(feature.properties?.highway) === className &&
            [
              roadAccessClasses.driveBothWays,
              roadAccessClasses.driveOneWayForward,
              roadAccessClasses.driveOneWayReverse
            ].includes(classifyRoadAccess(feature.properties))
        )
        .flatMap((feature) => geometryLines(feature.geometry))
        .map((coordinates) => linePath(coordinates));

      return `
        <g class="roads-${className}">
          ${paths.map((pathData) => `<path d="${pathData}" fill="none" stroke="${style.casingColour}" stroke-width="${style.casing}" stroke-linecap="round" stroke-linejoin="round"/>`).join("\n")}
          ${paths.map((pathData) => `<path d="${pathData}" fill="none" stroke="${style.fillColour}" stroke-width="${style.fill}" stroke-linecap="round" stroke-linejoin="round"/>`).join("\n")}
        </g>
      `;
    })
    .join("\n");

  const specialRoads = [
    {
      accessClass: roadAccessClasses.unknown,
      className: "road-unknown"
    },
    {
      accessClass: roadAccessClasses.pedestrianOnly,
      className: "road-pedestrian"
    },
    {
      accessClass: roadAccessClasses.serviceOrPrivate,
      className: "road-private"
    },
    {
      accessClass: roadAccessClasses.noMotorVehicle,
      className: "road-no-motor"
    }
  ]
    .map(({ accessClass, className }) => {
      const paths = datasets.roads.features
        .filter(
          (feature) => classifyRoadAccess(feature.properties) === accessClass
        )
        .flatMap((feature) => geometryLines(feature.geometry))
        .map((coordinates) => linePath(coordinates));
      return `<g class="${className}" data-access="${accessClass}">${paths
        .map((pathData) => `<path d="${pathData}"/>`)
        .join("\n")}</g>`;
    })
    .join("\n");

  return `${normalRoads}\n${specialRoads}`;
}

function pointAlongLine(points, targetDistance) {
  let traversed = 0;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = distance(start, end);
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

function renderOneWayArrows() {
  return datasets.roads.features
    .flatMap((feature) => {
      const accessClass = classifyRoadAccess(feature.properties);
      if (
        accessClass !== roadAccessClasses.driveOneWayForward &&
        accessClass !== roadAccessClasses.driveOneWayReverse
      ) {
        return [];
      }

      const points = feature.geometry.coordinates.map(project);
      if (accessClass === roadAccessClasses.driveOneWayReverse) points.reverse();
      const totalLength = points
        .slice(1)
        .reduce((sum, point, index) => sum + distance(points[index], point), 0);
      if (totalLength < 34) return [];
      const spacing = roadClass(feature.properties?.highway) === "major" ? 105 : 78;
      const arrowCount = Math.min(3, Math.max(1, Math.floor(totalLength / spacing)));

      return Array.from({ length: arrowCount }, (_, index) =>
        pointAlongLine(points, (totalLength * (index + 1)) / (arrowCount + 1))
      )
        .filter(Boolean)
        .map(({ point, angle }) => {
          const [x, y] = point;
          return `<g class="one-way-arrow" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})"><path d="M-6 0H5M1-4L5 0L1 4"/></g>`;
        });
    })
    .join("\n");
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function labelCandidate(feature) {
  const name = feature.properties?.name;
  const ref = feature.properties?.ref;
  const lines = geometryLines(feature.geometry);

  if (
    !name ||
    lines.length === 0 ||
    ![
      roadAccessClasses.driveBothWays,
      roadAccessClasses.driveOneWayForward,
      roadAccessClasses.driveOneWayReverse
    ].includes(classifyRoadAccess(feature.properties))
  ) {
    return null;
  }
  const className = roadClass(feature.properties?.highway);
  const coordinates = lines.sort((a, b) => b.length - a.length)[0];
  if (coordinates.length < 2) return null;
  const projected = coordinates.map(project);
  let longestSegment = null;

  for (let index = 1; index < projected.length; index += 1) {
    const segmentLength = distance(projected[index - 1], projected[index]);
    if (!longestSegment || segmentLength > longestSegment.length) {
      longestSegment = {
        start: projected[index - 1],
        end: projected[index],
        length: segmentLength
      };
    }
  }

  const minimumLength = { major: 26, main: 23, local: 18, minor: 28 }[
    className
  ];
  if (!longestSegment || longestSegment.length < minimumLength) return null;
  const midpoint = [
    (longestSegment.start[0] + longestSegment.end[0]) / 2,
    (longestSegment.start[1] + longestSegment.end[1]) / 2
  ];
  let angle =
    (Math.atan2(
      longestSegment.end[1] - longestSegment.start[1],
      longestSegment.end[0] - longestSegment.start[0]
    ) *
      180) /
    Math.PI;
  if (angle > 90 || angle < -90) angle += 180;

  return {
    name: ref && !name.includes(ref) ? `${name} ${ref}` : name,
    className,
    midpoint,
    angle,
    length: longestSegment.length
  };
}

function renderRoadLabels() {
  const candidates = datasets.roads.features
    .map(labelCandidate)
    .filter(Boolean)
    .sort((a, b) => {
      const rank = { major: 3, main: 2, local: 1, minor: 0 };
      return rank[b.className] - rank[a.className] || b.length - a.length;
    });
  const placed = [];
  const usedNames = new Set();

  for (const candidate of candidates) {
    if (candidate.className === "minor" || usedNames.has(candidate.name)) {
      continue;
    }
    const collisionDistance =
      candidate.className === "local"
        ? 46
        : candidate.className === "main"
          ? 54
          : 64;
    if (placed.some((label) => distance(label.midpoint, candidate.midpoint) < collisionDistance)) {
      continue;
    }
    usedNames.add(candidate.name);
    placed.push(candidate);
    if (placed.length >= 145) break;
  }

  return placed
    .map((label) => {
      const [x, y] = label.midpoint;
      return `<text class="road-label road-label-${label.className}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" transform="rotate(${label.angle.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})">${escapeXml(label.name.toUpperCase())}</text>`;
    })
    .join("\n");
}

function renderAreaLabels(
  dataset,
  className,
  { minimumArea = 0, maximumLabels = 30 } = {}
) {
  const seen = new Set();
  return dataset.features
    .filter((feature) => feature.properties?.name && feature.geometry)
    .map((feature) => {
      const name = feature.properties.name;
      if (seen.has(name)) return "";
      seen.add(name);
      const points = geometryLines(feature.geometry).flat().map(project);
      if (points.length === 0) return "";
      const xValues = points.map((point) => point[0]);
      const yValues = points.map((point) => point[1]);
      const area =
        (Math.max(...xValues) - Math.min(...xValues)) *
        (Math.max(...yValues) - Math.min(...yValues));
      const centre = points.reduce(
        (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
        [0, 0]
      ).map((value) => value / points.length);
      return { name, centre, area };
    })
    .filter((label) => label && label.area >= minimumArea)
    .sort((a, b) => b.area - a.area)
    .slice(0, maximumLabels)
    .map(
      ({ name, centre }) =>
        `<text class="${className}" x="${centre[0].toFixed(1)}" y="${centre[1].toFixed(1)}" text-anchor="middle">${escapeXml(name.toUpperCase())}</text>`
    )
    .join("\n");
}

function renderStations() {
  const seen = new Set();
  const suppressedLabels = new Set([
    "Euston",
    "London King's Cross",
    "St Pancras International"
  ]);
  const displayNames = new Map([
    ["London Euston", "Euston"],
    ["London St. Pancras International", "St Pancras International"]
  ]);
  return datasets.stations.features
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
      const label = suppressedLabels.has(name)
        ? ""
        : `<text x="10" y="4" text-anchor="start">${escapeXml(
            (displayNames.get(name) ?? name).toUpperCase()
          )}</text>`;
      return `
        <g class="station station-${stationType}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
          <circle cx="0" cy="0" r="5.5" fill="currentColor" stroke="#fff" stroke-width="2"/>
          ${label}
        </g>
      `;
    })
    .join("\n");
}

function renderRailLines() {
  return datasets.railLines.features
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

function featureCentre(feature) {
  if (feature.geometry?.type === "Point") return project(feature.geometry.coordinates);
  const points = geometryLines(feature.geometry).flat().map(project);
  if (points.length === 0) return null;
  return points
    .reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / points.length);
}

function landmarkRank(properties) {
  if (properties.name === "British Library") return 100;
  if (properties.amenity === "hospital" || properties.building === "hospital") {
    return 90;
  }
  if (["university", "college", "library"].includes(properties.amenity)) {
    return 80;
  }
  if (["museum", "attraction"].includes(properties.tourism)) return 70;
  if (properties.place === "square") return 60;
  if (["school", "courthouse", "townhall"].includes(properties.amenity)) {
    return 50;
  }
  return 30;
}

function renderLandmarks() {
  const placed = [];
  const seen = new Set();
  const candidates = datasets.landmarks.features
    .map((feature) => ({
      name: feature.properties.name,
      centre: featureCentre(feature),
      rank: landmarkRank(feature.properties)
    }))
    .filter((candidate) => candidate.centre)
    .sort((a, b) => b.rank - a.rank);

  for (const candidate of candidates) {
    if (seen.has(candidate.name)) continue;
    if (placed.some((label) => distance(label.centre, candidate.centre) < 110)) {
      continue;
    }
    seen.add(candidate.name);
    placed.push(candidate);
    if (placed.length >= 10) break;
  }

  return placed
    .map(
      ({ name, centre }) =>
        `<text class="landmark-label" x="${centre[0].toFixed(1)}" y="${centre[1].toFixed(1)}" text-anchor="middle">${escapeXml(name.toUpperCase())}</text>`
    )
    .join("\n");
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">King's Cross, Euston and Bloomsbury real-data training map</title>
  <description id="description">A topographical training map generated from OpenStreetMap road, station, park and water geometry.</description>
  <style>
    .building { fill: #e2ded4; stroke: #cbc6ba; stroke-width: .55; }
    .park { fill: #d7e4cb; stroke: #aebea2; stroke-width: 1; }
    .station-area { fill: #d8d5cf; stroke: #a6a29a; stroke-width: 1; }
    .water-area { fill: #c4dde5; stroke: #8eb6c1; stroke-width: 1; }
    .water-line { fill: none; stroke: #9fc8d3; stroke-width: 6; stroke-linecap: round; }
    .rail-surface { fill: none; stroke: #6e6b65; stroke-width: 1.15; stroke-linecap: round; opacity: .72; }
    .rail-subway { fill: none; stroke: #918d86; stroke-width: .8; stroke-dasharray: 5 4; opacity: .5; }
    .road-pedestrian path { fill: none; stroke: #c1bdb4; stroke-width: .75; stroke-dasharray: 2 3; opacity: .5; }
    .road-private path { fill: none; stroke: #8f8c85; stroke-width: 1.5; stroke-dasharray: 6 4; opacity: .75; }
    .road-no-motor path { fill: none; stroke: #925b58; stroke-width: 2.2; stroke-dasharray: 4 2; }
    .road-unknown path { fill: none; stroke: #c6c2b8; stroke-width: .8; stroke-dasharray: 2 4; }
    .one-way-arrow path { fill: none; stroke: #1f1e1b; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
    .road-label { fill: #363530; font-family: Arial, Helvetica, sans-serif; font-size: 9.2px; font-weight: 500; letter-spacing: .3px; paint-order: stroke; stroke: #f6f1e4; stroke-width: 2.5px; stroke-linejoin: round; }
    .road-label-major { fill: #201f1c; font-size: 12px; font-weight: 700; }
    .road-label-main { fill: #2b2a26; font-size: 10.5px; font-weight: 600; }
    .road-label-local { font-size: 8.7px; }
    .area-label { fill: #587052; font-family: Georgia, serif; font-size: 10px; font-style: italic; letter-spacing: .8px; paint-order: stroke; stroke: #e4ecd9; stroke-width: 2px; }
    .water-label { fill: #527b86; font-family: Georgia, serif; font-size: 10px; font-style: italic; letter-spacing: .8px; paint-order: stroke; stroke: #d5e7eb; stroke-width: 2px; }
    .landmark-label { fill: #594254; font-family: Georgia, serif; font-size: 9px; font-weight: 700; letter-spacing: .4px; paint-order: stroke; stroke: #f6f1e4; stroke-width: 3px; stroke-linejoin: round; }
    .station { color: #245f7d; }
    .station-subway { color: #8a3d4d; }
    .station-overground { color: #7a5b2c; }
    .station text { fill: #23221f; font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .4px; paint-order: stroke; stroke: #f6f1e4; stroke-width: 3px; stroke-linejoin: round; }
  </style>
  <rect width="${width}" height="${height}" fill="#f6f1e4"/>
  <g id="buildings">${renderAreaDataset(datasets.buildings, "building")}</g>
  <g id="parks">${renderAreaDataset(datasets.parks, "park")}</g>
  <g id="station-areas">${renderAreaDataset(datasets.stationAreas, "station-area")}</g>
  <g id="water-areas">${renderAreaDataset(datasets.water, "water-area")}</g>
  <g id="water-lines">${renderWaterLines()}</g>
  <g id="rail-lines">${renderRailLines()}</g>
  <g id="roads">${renderRoads()}</g>
  <g id="one-way-arrows">${renderOneWayArrows()}</g>
  <g id="road-labels">${renderRoadLabels()}</g>
  <g id="park-labels">${renderAreaLabels(datasets.parks, "area-label", { minimumArea: 1200, maximumLabels: 24 })}</g>
  <g id="water-labels">${renderAreaLabels(datasets.water, "water-label", { minimumArea: 250, maximumLabels: 10 })}</g>
  <g id="landmarks">${renderLandmarks()}</g>
  <g id="stations">${renderStations()}</g>
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" fill="none" stroke="#8a877f" stroke-width="1.5"/>
  <text x="18" y="${height - 16}" fill="#5a5852" font-family="Arial, Helvetica, sans-serif" font-size="10">${escapeXml(config.attribution)} - Generated for TopoPass training</text>
</svg>\n`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, "map.svg"), svg, "utf8");
console.log(
  `Rendered ${datasets.roads.features.length} real roads, ` +
    `${datasets.buildings.features.length} buildings and ` +
    `${datasets.stations.features.length} rail stations from osm-raw.geojson.`
);
