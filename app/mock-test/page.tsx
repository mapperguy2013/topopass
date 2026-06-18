import { AppShell } from "@/components/layout/AppShell";
import { MockTestFlow } from "@/src/components/mock-test/MockTestFlow";

export default function MockTestPage() {
  return (
    <AppShell title="Mock Test">
      <MockTestFlow />
    </AppShell>
  );
}
