import { AppShell } from "@/components/layout/AppShell";
import { AdminQuestionInventory } from "@/src/components/admin/AdminQuestionInventory";

type AdminQuestionsPageProps = {
  searchParams?: Promise<{
    status?: string;
    topic?: string;
    difficulty?: string;
  }>;
};

export default async function AdminQuestionsPage({
  searchParams
}: AdminQuestionsPageProps) {
  const filters = await searchParams;

  return (
    <AppShell title="Question Admin">
      <AdminQuestionInventory filters={filters ?? {}} />
    </AppShell>
  );
}
