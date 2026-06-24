import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const homeSource = readFileSync(path.join(projectRoot, "app/page.tsx"), "utf8");
const practiceSource = readFileSync(
  path.join(projectRoot, "app/practice/page.tsx"),
  "utf8"
);
const topographicalSource = readFileSync(
  path.join(projectRoot, "app/practice/topographical/page.tsx"),
  "utf8"
);
const seruPracticeSource = readFileSync(
  path.join(projectRoot, "app/practice/seru/page.tsx"),
  "utf8"
);
const demoSource = readFileSync(path.join(projectRoot, "app/demo/page.tsx"), "utf8");
const navbarSource = readFileSync(
  path.join(projectRoot, "components/layout/Navbar.tsx"),
  "utf8"
);
const sidebarSource = readFileSync(
  path.join(projectRoot, "components/layout/Sidebar.tsx"),
  "utf8"
);
const pricingSource = readFileSync(
  path.join(projectRoot, "app/pricing/page.tsx"),
  "utf8"
);
const socialPreview = path.join(
  projectRoot,
  "public/social/topopass-social.svg"
);
const heroVisual = path.join(
  projectRoot,
  "public/images/home-practice-overview-hero.svg"
);

test("home page promotes learner CTAs and map practice routes", () => {
  assert.match(homeSource, /Start practising/);
  assert.match(homeSource, /Try SERU practice/);
  assert.match(homeSource, /View progress/);
  assert.match(homeSource, /\/practice/);
  assert.match(homeSource, /\/practice\/seru/);
});

test("home page stays public and does not expose admin tooling", () => {
  assert.doesNotMatch(homeSource, /\/admin/);
  assert.doesNotMatch(homeSource, /draft|archived|question_bank_items/i);
});

test("home page is outcome-focused and keeps SERU visible without internal headings", () => {
  assert.match(homeSource, /TfL private hire and PCO preparation/);
  assert.match(
    homeSource,
    /Prepare for your TfL private hire assessment with confidence/
  );
  assert.match(homeSource, /Designed for focused revision before test day/);
  assert.match(homeSource, /What TopoPass helps you prepare for/);
  assert.match(homeSource, /SERU-style preparation/);
  assert.match(homeSource, /\/images\/home-practice-overview-hero\.svg/);
  assert.match(homeSource, /\/practice\/seru/);
  assert.match(homeSource, /not affiliated\s+with or endorsed by Transport for London/);
  assert.doesNotMatch(homeSource, /Two preparation areas/);
  assert.doesNotMatch(
    homeSource,
    /Topographical skills now, SERU support as a separate category/
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

test("home page uses the high-resolution practice overview visual asset", () => {
  const source = readFileSync(heroVisual, "utf8");
  assert.match(source, /Practice overview dashboard/);
  assert.match(source, /Build confidence with Topographical Skills and SERU Preparation/);
  assert.match(source, /Topographical\s+Skills/);
  assert.match(source, /SERU\s+Preparation/);
  assert.match(source, /74%/);
  assert.match(source, /3/);
  assert.match(source, /12/);
});

test("practice hub separates topographical and SERU learner journeys", () => {
  assert.match(practiceSource, /Choose what you want to practise today/);
  assert.match(practiceSource, /Start topographical practice/);
  assert.match(practiceSource, /\/practice\/topographical/);
  assert.match(practiceSource, /Start SERU practice/);
  assert.match(practiceSource, /\/practice\/seru/);
  assert.match(
    practiceSource,
    /Topographical and SERU-style practice are kept separate/
  );
  assert.match(practiceSource, /Try the short demo/);
});

test("topographical practice has its own route and keeps mock flow topographical", () => {
  assert.match(topographicalSource, /Build your London map and route confidence/);
  assert.match(topographicalSource, /PracticeTopicSelectorShell/);
  assert.match(topographicalSource, /\/practice\/knowledge/);
  assert.match(topographicalSource, /\/mock-test/);
  assert.doesNotMatch(topographicalSource, /SERU mock/);
});

test("SERU practice keeps safe wording and separate practice controls", () => {
  assert.match(
    seruPracticeSource,
    /Practise private-hire knowledge with clear explanations/
  );
  assert.match(seruPracticeSource, /SERU-style practice helps you revise/);
  assert.match(seruPracticeSource, /SERU mock coming soon/);
  assert.match(seruPracticeSource, /not affiliated with or endorsed by Transport/);
  assert.doesNotMatch(seruPracticeSource, /official TfL questions/i);
});

test("demo is positioned as a public preview, not full practice", () => {
  assert.match(demoSource, /Short public demo/);
  assert.match(demoSource, /Start full practice/);
  assert.match(demoSource, /Create account to save progress/);
  assert.match(demoSource, /Practice is the real learning area/);
});

test("navigation separates public marketing links from signed-in learner links", () => {
  const publicNavSection =
    navbarSource.match(/const publicNavItems = \[[\s\S]*?\];/)?.[0] ?? "";

  assert.match(navbarSource, /publicNavItems/);
  assert.match(navbarSource, /\/practice\/topographical/);
  assert.match(navbarSource, /\/practice\/seru/);
  assert.match(navbarSource, /\/demo/);
  assert.match(navbarSource, /learnerNavItems/);
  assert.match(navbarSource, /\/dashboard/);
  assert.match(navbarSource, /\/review/);
  assert.match(navbarSource, /Start practising/);
  assert.doesNotMatch(publicNavSection, /Progress/);
});

test("sidebar groups study, practice, review, and account links", () => {
  assert.match(sidebarSource, /title: "Study"/);
  assert.match(sidebarSource, /title: "Practice"/);
  assert.match(sidebarSource, /title: "Review"/);
  assert.match(sidebarSource, /title: "Account"/);
  assert.match(sidebarSource, /\/practice\/topographical/);
  assert.match(sidebarSource, /\/progress\/mistakes/);
});
