import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { MockTestFlow } from "@/src/components/mock-test/MockTestFlow";

export const metadata = buildPageMetadata({
  title: "Mock Test",
  description:
    "Take topographical-only mock exams with knowledge, map-click, and route-planning questions plus review feedback.",
  path: "/mock-test"
});

export default function MockTestPage() {
  return (
    <AppShell title="Mock Test">
      <MockTestFlow />
    </AppShell>
  );
}
