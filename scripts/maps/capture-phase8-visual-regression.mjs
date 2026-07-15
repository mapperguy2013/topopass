import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultOutputDirectory = path.join(repositoryRoot, "docs/phase-8/screenshots/stage-8-11");

const fixtures = [
  { id: "victoria-neutral-desktop", file: "victoria-neutral-desktop.png", width: 1440, height: 900 },
  { id: "kings-cross-correct-review-desktop", file: "kings-cross-correct-review-desktop.png", width: 1440, height: 900 },
  { id: "piccadilly-active-route-desktop", file: "piccadilly-active-route-desktop.png", width: 1440, height: 900 },
  { id: "waterloo-context-tablet", file: "waterloo-context-tablet.png", width: 768, height: 1024 },
  { id: "waterloo-incorrect-review-mobile", file: "waterloo-incorrect-review-mobile.png", width: 390, height: 844 },
  { id: "piccadilly-hint-mobile", file: "piccadilly-hint-mobile.png", width: 390, height: 844 },
  { id: "quiet-residential-mobile", file: "quiet-residential-mobile.png", width: 390, height: 844 }
];

const args = process.argv.slice(2);
const outputDirectory = path.resolve(readArg("--output") ?? defaultOutputDirectory);
const baseUrl = readArg("--base-url") ?? "http://127.0.0.1:3000";
const requestedFixtureIds = args
  .filter((arg, index) => args[index - 1] === "--fixture")
  .flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean));
const selectedFixtures = requestedFixtureIds.length > 0
  ? fixtures.filter((fixture) => requestedFixtureIds.includes(fixture.id))
  : fixtures;

if (requestedFixtureIds.length > 0 && selectedFixtures.length !== requestedFixtureIds.length) {
  const foundIds = new Set(selectedFixtures.map((fixture) => fixture.id));
  const missingIds = requestedFixtureIds.filter((id) => !foundIds.has(id));
  throw new Error(`Unknown Phase 8 visual fixture(s): ${missingIds.join(", ")}`);
}

await mkdir(outputDirectory, { recursive: true });

const edgePath = findEdgePath();
const results = [];
for (const fixture of selectedFixtures) {
  results.push(await captureFixture(fixture));
}

console.log(JSON.stringify({ outputDirectory, results }, null, 2));

async function captureFixture(fixture) {
  const profileDirectory = path.join(repositoryRoot, ".tmp/phase8-visual-capture", fixture.id);
  await rm(profileDirectory, { recursive: true, force: true });
  await mkdir(profileDirectory, { recursive: true });

  const port = await getFreePort();
  const browser = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--disable-background-networking",
    "--disable-features=PaintHolding",
    "--force-device-scale-factor=1",
    `--window-size=${fixture.width},${fixture.height}`,
    `--user-data-dir=${profileDirectory}`,
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    "about:blank"
  ], {
    stdio: ["ignore", "ignore", "ignore"],
    windowsHide: true
  });

  const outputPath = path.join(outputDirectory, fixture.file);
  try {
    const endpoint = await createTarget(port, fixtureUrl(fixture.id));
    const client = await connectCdp(endpoint.webSocketDebuggerUrl);
    try {
      await sendCdp(client, "Page.enable");
      await sendCdp(client, "Runtime.enable");
      await sendCdp(client, "Emulation.setDeviceMetricsOverride", {
        width: fixture.width,
        height: fixture.height,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: fixture.width,
        screenHeight: fixture.height
      });
      await sendCdp(client, "Page.navigate", { url: fixtureUrl(fixture.id) });
      await waitForVisualReady(client, fixture.id);
      await pause(750);
      const screenshot = await sendCdp(client, "Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false
      });
      const bytes = Buffer.from(screenshot.data, "base64");
      await writeFile(outputPath, bytes);
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
      await sendCdp(client, "Browser.close").catch(() => undefined);
      return {
        id: fixture.id,
        file: path.relative(repositoryRoot, outputPath).replace(/\\/g, "/"),
        width: fixture.width,
        height: fixture.height,
        bytes: bytes.length,
        sha256
      };
    } finally {
      client.close();
    }
  } finally {
    await stopBrowser(browser);
  }
}

function fixtureUrl(fixtureId) {
  const url = new URL(`/dev/route-runner/visual-regression/${fixtureId}`, baseUrl);
  url.searchParams.set("phase8Capture", "stage-8-8-3");
  return url.toString();
}

async function createTarget(port, url) {
  await waitForDevTools(port);
  const encodedUrl = encodeURIComponent(url);
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodedUrl}`, { method: "PUT" });
  if (!response.ok) {
    throw new Error(`Unable to create capture target: ${response.status} ${response.statusText}`);
  }

  const target = await response.json();
  if (typeof target.webSocketDebuggerUrl !== "string") {
    throw new Error("Capture target did not expose a DevTools WebSocket URL.");
  }

  return target;
}

async function waitForDevTools(port) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Browser is still starting.
    }
    await pause(250);
  }

  throw new Error(`Timed out waiting for Edge DevTools on port ${port}.`);
}

async function connectCdp(webSocketUrl) {
  const websocket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 1;

  websocket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (typeof message.id !== "number") return;

    const callbacks = pending.get(message.id);
    if (!callbacks) return;

    pending.delete(message.id);
    if (message.error) {
      callbacks.reject(new Error(`${message.error.message}: ${message.error.data ?? ""}`.trim()));
    } else {
      callbacks.resolve(message.result ?? {});
    }
  });

  await new Promise((resolve, reject) => {
    websocket.addEventListener("open", resolve, { once: true });
    websocket.addEventListener("error", reject, { once: true });
  });

  return {
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      const payload = JSON.stringify({ id, method, params });
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        websocket.send(payload);
      });
    },
    close() {
      websocket.close();
    }
  };
}

function sendCdp(client, method, params = {}) {
  return withTimeout(client.send(method, params), 120000, `${method} timed out`);
}

async function waitForVisualReady(client, fixtureId) {
  const startedAt = Date.now();
  let lastState = null;
  while (Date.now() - startedAt < 180000) {
    const result = await sendCdp(client, "Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const canvas = document.querySelector('canvas[data-phase8-visual-ready="true"]');
        return {
          ready: Boolean(canvas),
          fixture: canvas?.getAttribute('data-phase8-visual-fixture') ?? null,
          state: canvas?.getAttribute('data-phase8-visual-state') ?? null,
          width: window.innerWidth,
          height: window.innerHeight,
          title: document.title
        };
      })()`
    });
    lastState = result.result?.value ?? null;
    if (lastState?.ready && lastState.fixture === fixtureId) {
      return lastState;
    }
    await pause(500);
  }

  throw new Error(`Timed out waiting for ${fixtureId} visual-ready canvas. Last state: ${JSON.stringify(lastState)}`);
}

async function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function stopBrowser(browser) {
  if (browser.exitCode !== null) return;
  browser.kill();
  await new Promise((resolve) => {
    browser.once("exit", resolve);
    setTimeout(resolve, 5000);
  });
}

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  if (typeof address !== "object" || address === null) {
    throw new Error("Unable to allocate a capture port.");
  }
  return address.port;
}

function findEdgePath() {
  const candidates = [
    process.env.PHASE8_CAPTURE_BROWSER,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
  ].filter(Boolean);

  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error("Unable to find Edge or Chrome for Phase 8 visual capture.");
  }
  return match;
}

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
