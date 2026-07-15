import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDirectory = path.join(repositoryRoot, "lib/map-engine/osm/fixtures");

const fixtures = [
  {
    id: "piccadilly-circus",
    label: "Piccadilly Circus",
    output: "piccadillyCircusContextOverpass.json",
    bounds: { south: 51.5077287, west: -0.1402665, north: 51.5163823, east: -0.1218951 }
  },
  {
    id: "waterloo-bridge",
    label: "Waterloo Bridge",
    output: "waterlooBridgeContextOverpass.json",
    bounds: { south: 51.502404, west: -0.1261758, north: 51.515128, east: -0.0937449 }
  },
  {
    id: "kings-cross-euston",
    label: "King's Cross / Euston",
    output: "kingsCrossEustonContextOverpass.json",
    bounds: { south: 51.52325, west: -0.1425, north: 51.53525, east: -0.10975 }
  },
  {
    id: "one-way-system-area",
    label: "One-way system area",
    output: "oneWaySystemAreaContextOverpass.json",
    bounds: { south: 51.5168937, west: -0.1428499, north: 51.5292981, east: -0.1125334 }
  },
  {
    id: "quiet-residential-roads",
    label: "Quiet residential roads",
    output: "quietResidentialRoadsContextOverpass.json",
    bounds: { south: 51.5527549, west: -0.2131413, north: 51.5723187, east: -0.1812709 }
  }
];

const endpoints = (process.env.OVERPASS_ENDPOINTS ?? process.env.OVERPASS_ENDPOINT ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const overpassEndpoints = endpoints.length > 0
  ? endpoints
  : [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter"
    ];

const queryGroups = [
  {
    id: "buildings",
    selectors: [
      'way["building"]',
      'relation["building"]'
    ]
  },
  {
    id: "land-and-water",
    selectors: [
      'way["leisure"]',
      'relation["leisure"]',
      'way["landuse"]',
      'relation["landuse"]',
      'way["natural"]',
      'relation["natural"]',
      'way["waterway"]',
      'relation["waterway"]'
    ]
  },
  {
    id: "transport-and-places",
    selectors: [
      'node["railway"]',
      'way["railway"]',
      'relation["railway"]',
      'node["public_transport"]',
      'way["public_transport"]',
      'relation["public_transport"]',
      'node["place"]',
      'way["place"]',
      'relation["place"]'
    ]
  },
  {
    id: "amenities",
    selectors: [
      'node["amenity"]',
      'way["amenity"]',
      'relation["amenity"]'
    ]
  },
  {
    id: "tourism-and-history",
    selectors: [
      'node["tourism"]',
      'way["tourism"]',
      'relation["tourism"]',
      'node["historic"]',
      'way["historic"]',
      'relation["historic"]'
    ]
  },
  {
    id: "shops",
    selectors: [
      'node["shop"]',
      'way["shop"]',
      'relation["shop"]'
    ]
  },
  {
    id: "offices",
    selectors: [
      'node["office"]',
      'way["office"]',
      'relation["office"]'
    ]
  },
  {
    id: "barriers",
    optional: true,
    selectors: [
      'node["barrier"]',
      'way["barrier"]',
      'relation["barrier"]'
    ]
  }
];

function bbox({ south, west, north, east }) {
  return `${south},${west},${north},${east}`;
}

export function stage883ContextQuery(bounds, group) {
  const box = bbox(bounds);
  const body = group.selectors.map((selector) => `  ${selector}(${box});`).join("\n");

  return `[out:json][timeout:60];
(
${body}
);
out body geom;`;
}

async function fetchOverpass(query, label) {
  const errors = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    if (attempt > 1) {
      await pause(20000);
    }

    for (const endpoint of overpassEndpoints) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(90000),
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent": "TopoPass Phase 8.8.3 context supplement pull"
        },
        body: new URLSearchParams({ data: query })
      });
    } catch (error) {
      errors.push(`${endpoint} attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    if (!response.ok) {
      errors.push(`${endpoint} attempt ${attempt}: ${response.status} ${response.statusText}`);
      if (response.status === 429) {
        await pause(30000);
      }
      continue;
    }

    const data = await response.json();
    if (!Array.isArray(data.elements)) {
      errors.push(`${endpoint} attempt ${attempt}: response did not contain an elements array`);
      continue;
    }

    return { endpoint, data };
  }
  }

  throw new Error(`${label}: all Overpass endpoints failed (${errors.join("; ")})`);
}

function mergeElementMaps(left, right) {
  for (const element of right) {
    if (!element || typeof element.type !== "string" || typeof element.id !== "number") {
      continue;
    }

    left.set(`${element.type}:${element.id}`, element);
  }
}

function countElementTypes(elements) {
  return {
    elementCount: elements.length,
    nodeCount: elements.filter((element) => element.type === "node").length,
    wayCount: elements.filter((element) => element.type === "way").length,
    relationCount: elements.filter((element) => element.type === "relation").length
  };
}

async function pause(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function pullFixture(fixture) {
  const elementsByKey = new Map();
  const groupResults = [];

  for (const group of queryGroups) {
    const query = stage883ContextQuery(fixture.bounds, group);
    console.error(`Pulling ${fixture.id}/${group.id}`);
    let endpoint;
    let data;
    try {
      ({ endpoint, data } = await fetchOverpass(query, `${fixture.label} ${group.id}`));
    } catch (error) {
      if (group.optional) {
        console.error(`Skipping optional ${fixture.id}/${group.id}: ${error instanceof Error ? error.message : String(error)}`);
        groupResults.push({
          id: group.id,
          endpoint: null,
          timestampOsmBase: null,
          query,
          optional: true,
          skipped: true,
          error: error instanceof Error ? error.message : String(error),
          elementCount: 0,
          nodeCount: 0,
          wayCount: 0,
          relationCount: 0
        });
        continue;
      }

      throw error;
    }
    console.error(`Pulled ${fixture.id}/${group.id}: ${data.elements.length} elements from ${endpoint}`);
    mergeElementMaps(elementsByKey, data.elements);
    groupResults.push({
      id: group.id,
      endpoint,
      timestampOsmBase: typeof data.osm3s?.timestamp_osm_base === "string" ? data.osm3s.timestamp_osm_base : null,
      query,
      ...countElementTypes(data.elements)
    });
    await pause(5000);
  }

  const elements = Array.from(elementsByKey.values()).sort((left, right) => {
    const typeOrder = left.type.localeCompare(right.type);
    return typeOrder || left.id - right.id;
  });
  const data = {
    version: 0.6,
    generator: "TopoPass Stage 8.8.3 targeted Overpass context supplement",
    osm3s: {
      timestamp_osm_base: groupResults.find((group) => group.timestampOsmBase)?.timestampOsmBase ?? null,
      copyright: "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."
    },
    elements
  };

  const outputPath = path.join(fixtureDirectory, fixture.output);
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  return {
    id: fixture.id,
    label: fixture.label,
    output: path.relative(repositoryRoot, outputPath).replace(/\\/g, "/"),
    bounds: fixture.bounds,
    ...countElementTypes(elements),
    groups: groupResults.map((group) => ({
      id: group.id,
      endpoint: group.endpoint,
      optional: Boolean(group.optional),
      skipped: Boolean(group.skipped),
      error: group.error,
      elementCount: group.elementCount,
      nodeCount: group.nodeCount,
      wayCount: group.wayCount,
      relationCount: group.relationCount,
      query: group.query
    }))
  };
}

await mkdir(fixtureDirectory, { recursive: true });

const requestedFixtureIds = new Set(process.argv.slice(2));
const selectedFixtures = requestedFixtureIds.size > 0
  ? fixtures.filter((fixture) => requestedFixtureIds.has(fixture.id))
  : fixtures;

if (requestedFixtureIds.size > 0 && selectedFixtures.length !== requestedFixtureIds.size) {
  const foundIds = new Set(selectedFixtures.map((fixture) => fixture.id));
  const missingIds = [...requestedFixtureIds].filter((id) => !foundIds.has(id));
  throw new Error(`Unknown fixture id(s): ${missingIds.join(", ")}`);
}

const results = [];
for (const fixture of selectedFixtures) {
  results.push(await pullFixture(fixture));
}

console.log(JSON.stringify({ endpoints: overpassEndpoints, results }, null, 2));
