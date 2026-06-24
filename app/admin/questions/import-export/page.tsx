import { AppShell } from "@/components/layout/AppShell";
import { QuestionImportExportPanel } from "@/src/components/admin/QuestionImportExportPanel";

export default function AdminQuestionImportExportPage() {
  return (
    <AppShell title="Question Import / Export">
      <QuestionImportExportPanel />
    </AppShell>
  );
}
