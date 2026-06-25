import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { SeruMockTestFlow } from "@/src/components/practice/SeruMockTestFlow";

export const metadata = buildPageMetadata({
  title: "SERU Mock Test",
  description:
    "Take a mixed SERU mock with PHV handbook, sentence completion, advanced English, and reading-understanding questions.",
  path: "/practice/seru/mock-test"
});

export default function SeruMockTestPage() {
  return (
    <AppShell title="SERU Mock Test">
      <SeruMockTestFlow />
    </AppShell>
  );
}
