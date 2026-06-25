import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const homeSource = readFileSync(path.join(projectRoot, "app/page.tsx"), "utf8");
const topographicalPublicSource = readFileSync(
  path.join(projectRoot, "app/topographical/page.tsx"),
  "utf8"
);
const seruPublicSource = readFileSync(
  path.join(projectRoot, "app/seru/page.tsx"),
  "utf8"
);
const courseSource = readFileSync(
  path.join(projectRoot, "app/course/page.tsx"),
  "utf8"
);
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
const seruPhvHandbookSource = readFileSync(
  path.join(projectRoot, "app/practice/seru/phv-handbook/page.tsx"),
  "utf8"
);
const seruEnglishSingleSource = readFileSync(
  path.join(projectRoot, "app/practice/seru/english-complete-sentence/page.tsx"),
  "utf8"
);
const seruEnglishAdvancedSource = readFileSync(
  path.join(projectRoot, "app/practice/seru/english-advanced/page.tsx"),
  "utf8"
);
const seruReadingSource = readFileSync(
  path.join(projectRoot, "app/practice/seru/reading-understanding/page.tsx"),
  "utf8"
);
const seruSentenceFlowSource = readFileSync(
  path.join(
    projectRoot,
    "src/components/practice/SeruSentenceCompletionPracticeFlow.tsx"
  ),
  "utf8"
);
const seruReadingFlowSource = readFileSync(
  path.join(
    projectRoot,
    "src/components/practice/SeruReadingComprehensionPracticeFlow.tsx"
  ),
  "utf8"
);
const demoSource = readFileSync(path.join(projectRoot, "app/demo/page.tsx"), "utf8");
const topographicalDemoSource = readFileSync(
  path.join(projectRoot, "app/demo/topographical/page.tsx"),
  "utf8"
);
const seruDemoSource = readFileSync(
  path.join(projectRoot, "app/demo/seru/page.tsx"),
  "utf8"
);
const demoFlowSource = readFileSync(
  path.join(projectRoot, "src/components/demo/DemoQuestionFlow.tsx"),
  "utf8"
);
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
const footerSource = readFileSync(
  path.join(projectRoot, "components/layout/Footer.tsx"),
  "utf8"
);
const newsletterActionSource = readFileSync(
  path.join(projectRoot, "app/newsletter/actions.ts"),
  "utf8"
);
const newsletterFormSource = readFileSync(
  path.join(projectRoot, "src/components/newsletter/NewsletterSignupForm.tsx"),
  "utf8"
);
const infoPageSources = [
  "app/about/page.tsx",
  "app/contact/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/disclaimer/page.tsx"
].map((file) => readFileSync(path.join(projectRoot, file), "utf8"));
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
  assert.match(
    homeSource,
    /A structured preparation course for TfL private hire learners/
  );
  assert.match(homeSource, /Topographical course/);
  assert.match(homeSource, /SERU-style preparation course/);
  assert.match(homeSource, /\/images\/home-practice-overview-hero\.svg/);
  assert.match(homeSource, /\/topographical/);
  assert.match(homeSource, /\/seru/);
  assert.match(homeSource, /\/practice\/seru/);
  assert.match(homeSource, /not affiliated\s+with or endorsed by Transport for London/);
  assert.doesNotMatch(homeSource, /official course|TfL-approved course|guaranteed pass/i);
  assert.doesNotMatch(homeSource, /Two preparation areas/);
  assert.doesNotMatch(
    homeSource,
    /Topographical skills now, SERU support as a separate category/
  );
});

test("pricing page defines beta plans without live payments", () => {
  assert.match(pricingSource, /planDefinitions/);
  assert.match(pricingSource, /PricingViewedTracker/);
  assert.match(pricingSource, /UpgradeInterestButton/);
  assert.match(pricingSource, /free_practice_continued/);
  assert.match(pricingSource, /No live payment provider is connected yet/);
  assert.match(pricingSource, /One TopoPass account/);
  assert.match(pricingSource, /Topographical map preparation/);
  assert.match(pricingSource, /SERU-style private\s+hire knowledge practice/);
  assert.doesNotMatch(pricingSource, /from\s+["']stripe/i);
});

test("footer carries independent preparation disclaimer", () => {
  assert.match(footerSource, /independent learning tool/);
  assert.match(footerSource, /not affiliated with or endorsed by Transport for London/);
  assert.match(footerSource, /SERU-style questions are original learning questions/);
  assert.match(footerSource, /© 2026 TopoPass\. All rights reserved\./);
  assert.match(footerSource, /support@topopass\.co\.uk/);
  assert.match(footerSource, /\/about/);
  assert.match(footerSource, /\/contact/);
  assert.match(footerSource, /\/privacy/);
  assert.match(footerSource, /\/terms/);
  assert.match(footerSource, /\/disclaimer/);
  assert.match(footerSource, /Instagram/);
  assert.match(footerSource, /TikTok/);
  assert.match(footerSource, /coming soon/);
});

test("newsletter signup is Supabase-backed without an email provider", () => {
  assert.match(footerSource, /NewsletterSignupForm/);
  assert.match(newsletterFormSource, /Get TopoPass updates|Get updates/);
  assert.match(newsletterFormSource, /newsletter_signup_started/);
  assert.match(newsletterFormSource, /newsletter_signup_submitted/);
  assert.match(newsletterFormSource, /newsletter_signup_success/);
  assert.match(newsletterFormSource, /newsletter_signup_error/);
  assert.match(newsletterActionSource, /\.from\("newsletter_signups"\)/);
  assert.match(newsletterActionSource, /support@topopass\.co\.uk/);
  assert.doesNotMatch(newsletterActionSource, /mailchimp|sendgrid|resend|convertkit/i);
  assert.doesNotMatch(newsletterFormSource, /mailchimp|sendgrid|resend|convertkit/i);
});

test("information and legal pages exist with beta-ready placeholder copy", () => {
  for (const source of infoPageSources) {
    assert.match(source, /<Navbar \/>/);
    assert.match(source, /<Footer \/>/);
    assert.match(source, /buildPageMetadata/);
    assert.match(source, /support@topopass\.co\.uk|TopoPass|Last updated: 2026/);
    assert.doesNotMatch(source, /Company number|registered office|guaranteed pass/i);
  }
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
    /Choose a focused SERU practice area/
  );
  assert.match(seruPracticeSource, /PHV Driver Handbook Practice/);
  assert.match(seruPracticeSource, /SERU English - Complete the Sentence/);
  assert.match(seruPracticeSource, /SERU English - Advanced Sentence Completion/);
  assert.match(seruPracticeSource, /SERU Reading and Understanding/);
  assert.match(seruPracticeSource, /\/practice\/seru\/phv-handbook/);
  assert.match(seruPracticeSource, /\/practice\/seru\/english-complete-sentence/);
  assert.match(seruPracticeSource, /\/practice\/seru\/english-advanced/);
  assert.match(seruPracticeSource, /\/practice\/seru\/reading-understanding/);
  assert.match(seruPracticeSource, /They are not official TfL questions/);
  assert.match(seruPracticeSource, /not\s+affiliated with or endorsed by Transport/);
  assert.doesNotMatch(seruPracticeSource, /KnowledgePracticeFlow/);
  assert.doesNotMatch(seruPracticeSource, /SeruSentenceCompletionPracticeFlow/);
  assert.doesNotMatch(seruPracticeSource, /official course|TfL-approved course|guaranteed pass/i);
});

test("SERU dedicated practice routes render the active flows separately", () => {
  assert.match(seruPhvHandbookSource, /phvHandbookSections/);
  assert.match(seruPhvHandbookSource, /Practice all PHV Handbook questions/);
  assert.match(seruPhvHandbookSource, /KnowledgePracticeFlow/);
  assert.match(seruPhvHandbookSource, /topic=/);

  assert.match(seruEnglishSingleSource, /sentenceCompletionQuestions/);
  assert.match(seruEnglishSingleSource, /mode="single"/);
  assert.match(seruEnglishAdvancedSource, /advancedSentenceCompletionQuestions/);
  assert.match(seruEnglishAdvancedSource, /mode="advanced"/);
  assert.match(seruReadingSource, /SERU_READING_UNDERSTANDING_QUESTIONS/);
  assert.match(seruReadingSource, /SeruReadingComprehensionPracticeFlow/);
});

test("SERU sentence completion uses inline selectable blanks", () => {
  assert.match(seruSentenceFlowSource, /data-inline-blank="true"/);
  assert.match(seruSentenceFlowSource, /<select/);
  assert.match(seruSentenceFlowSource, /<option value="">Select<\/option>/);
  assert.match(seruSentenceFlowSource, /onDrop/);
  assert.match(seruSentenceFlowSource, /Clear all/);
  assert.match(seruSentenceFlowSource, /blankResults/);
});

test("SERU reading flow renders passage, question, scoring, and progress saving", () => {
  assert.match(seruReadingFlowSource, /Passage/);
  assert.match(seruReadingFlowSource, /scoreSeruReadingQuestion/);
  assert.match(seruReadingFlowSource, /savePracticeAttempt/);
  assert.match(seruReadingFlowSource, /questionSubtype: "reading_comprehension"/);
  assert.match(seruReadingFlowSource, /PracticeSessionSummaryPanel/);
});

test("demo is positioned as a public preview, not full practice", () => {
  assert.match(demoSource, /Free demo/);
  assert.match(demoSource, /Topographical demo/);
  assert.match(demoSource, /SERU demo/);
  assert.match(demoSource, /10 questions/);
  assert.match(demoSource, /timed demo/);
  assert.match(demoSource, /Start full practice/);
  assert.match(demoSource, /no full progress dashboard/);
  assert.match(topographicalDemoSource, /\/practice\/topographical/);
  assert.match(seruDemoSource, /\/practice\/seru/);
  assert.match(demoFlowSource, /const DEMO_SECONDS = 10 \* 60/);
  assert.match(demoFlowSource, /Create account \/ sign in to save progress/);
});

test("navigation separates public marketing links from signed-in learner links", () => {
  const publicNavSection =
    navbarSource.match(/const publicNavItems = \[[\s\S]*?\];/)?.[0] ?? "";
  const courseSection =
    navbarSource.match(/const courseItems = \[[\s\S]*?\];/)?.[0] ?? "";

  assert.match(navbarSource, /Course/);
  assert.match(navbarSource, /courseItems/);
  assert.match(courseSection, /\/topographical/);
  assert.match(courseSection, /\/seru/);
  assert.match(courseSection, /\/course/);
  assert.match(courseSection, /Topographical Course/);
  assert.match(courseSection, /SERU Course/);
  assert.match(courseSection, /How the course works/);
  assert.doesNotMatch(courseSection, /Free demo/);
  assert.doesNotMatch(courseSection, /\/demo/);
  assert.match(navbarSource, /publicNavItems/);
  assert.match(navbarSource, /\/demo/);
  assert.match(navbarSource, /learnerNavItems/);
  assert.match(navbarSource, /\/dashboard/);
  assert.match(navbarSource, /\/review/);
  assert.match(navbarSource, /Start practising/);
  assert.doesNotMatch(publicNavSection, /Progress/);
});

test("course page explains the public course without app dashboard layout", () => {
  assert.match(courseSource, /How the course works/);
  assert.match(
    courseSource,
    /A guided preparation course for TfL private hire learners/
  );
  assert.match(courseSource, /Your course journey/);
  assert.match(courseSource, /What is included in the course\?/);
  assert.match(courseSource, /See what the course looks like/);
  assert.match(courseSource, /Built for focused revision/);
  assert.match(courseSource, /Independent learning support/);
  assert.match(courseSource, /not affiliated\s+with, endorsed by, or sponsored by Transport for London/);
  assert.match(courseSource, /<Navbar \/>/);
  assert.match(courseSource, /<Footer \/>/);
  assert.doesNotMatch(courseSource, /AppShell|Sidebar/);
  assert.doesNotMatch(courseSource, /official course|TfL-approved course|guaranteed pass/i);
});

test("sidebar groups study, practice, review, and account links", () => {
  assert.match(sidebarSource, /title: "Study"/);
  assert.match(sidebarSource, /title: "Practice"/);
  assert.match(sidebarSource, /title: "Review"/);
  assert.match(sidebarSource, /title: "Account"/);
  assert.match(sidebarSource, /\/practice\/topographical/);
  assert.match(sidebarSource, /\/progress\/mistakes/);
});

test("public assessment pages use public layout and safe independent wording", () => {
  for (const source of [topographicalPublicSource, seruPublicSource]) {
    assert.match(source, /<Navbar \/>/);
    assert.match(source, /<Footer \/>/);
    assert.doesNotMatch(source, /AppShell|Sidebar/);
    assert.doesNotMatch(source, /guarantee|guaranteed pass/i);
    assert.doesNotMatch(source, /are official TfL questions|official questions from TfL/i);
  }

  assert.match(
    topographicalPublicSource,
    /Build confidence with a structured topographical course/
  );
  assert.match(topographicalPublicSource, /Topographical Course/);
  assert.match(topographicalPublicSource, /\/practice\/topographical/);
  assert.match(topographicalPublicSource, /not affiliated\s+with or endorsed by Transport for London/);
  assert.match(
    seruPublicSource,
    /SERU stands for Safety, Equality and Regulatory Understanding/
  );
  assert.match(seruPublicSource, /SERU Course/);
  assert.match(seruPublicSource, /SERU-style preparation course/);
  assert.match(seruPublicSource, /\/practice\/seru/);
  assert.match(seruPublicSource, /original revision content/);
});
