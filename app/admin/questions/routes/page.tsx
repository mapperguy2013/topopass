import { AppShell } from "@/components/layout/AppShell";
import { RouteQuestionAdmin } from "@/src/components/admin/RouteQuestionAdmin";

export default function AdminRouteQuestionsPage() {
  return (
    <AppShell title="Route Question Admin">
      <RouteQuestionAdmin />
    </AppShell>
  );
}
