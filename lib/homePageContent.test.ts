import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const homeSource = readFileSync(path.join(projectRoot, "app/page.tsx"), "utf8");
const pricingSource = readFileSync(
  path.join(projectRoot, "app/pricing/page.tsx"),
  "utf8"
);
const socialPreview = path.join(
  projectRoot,
  "public/social/topopass-social.svg"
);

test("home page promotes learner CTAs and map practice routes", () => {
  assert.match(homeSource, /Start practising/);
  assert.match(homeSource, /Explore SERU preparation/);
  assert.match(homeSource, /View progress/);
  assert.match(homeSource, /\/practice\/map-click/);
  assert.match(homeSource, /\/practice\/routes/);
  assert.match(homeSource, /\/practice\/knowledge/);
  assert.match(homeSource, /\/practice\/seru/);
});

test("home page stays public and does not expose admin tooling", () => {
  assert.doesNotMatch(homeSource, /\/admin/);
  assert.doesNotMatch(homeSource, /draft|archived|question_bank_items/i);
});

test("home page positions SERU as a separate product area", () => {
  assert.match(homeSource, /SERU Preparation/);
  assert.match(homeSource, /\/practice\/seru/);
  assert.match(homeSource, /SERU questions do not get mixed into topographical mocks/);
  assert.match(homeSource, /not affiliated\s+with or endorsed by Transport for London/);
  assert.match(
    homeSource,
    /One account\. Two clear learning areas: Topographical Skills and\s+SERU Preparation/
  );
});

test("pricing page keeps payments as placeholders and links one account to both areas", () => {
  assert.match(pricingSource, /Payments not live/);
  assert.match(pricingSource, /Topographical and SERU preparation in one account/);
  assert.match(pricingSource, /No Stripe or payment provider connected yet/);
  assert.doesNotMatch(pricingSource, /from\s+["']stripe/i);
});

test("public social preview asset exists", () => {
  const source = readFileSync(socialPreview, "utf8");
  assert.match(source, /TopoPass private hire learner practice/);
});
