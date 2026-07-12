import {
  buildPhase8GeographicRenderDataAuditReport,
  formatPhase8GeographicRenderDataAuditSummary
} from "../../app/dev/route-runner/phase8GeographicRenderDataAudit.ts";

const report = buildPhase8GeographicRenderDataAuditReport();
const wantsJson = process.argv.includes("--json");

if (wantsJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatPhase8GeographicRenderDataAuditSummary(report));
}
