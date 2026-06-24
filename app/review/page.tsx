import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/session";
import { listMockAttempts } from "@/lib/db/mockAttemptRepository";
import { listPracticeAttempts } from "@/lib/db/practiceAttemptRepository";
import { buildReviewHistory } from "@/lib/review/reviewHistory";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewHistory } from "@/src/components/review/ReviewHistory";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  const supabase = user ? await createSupabaseServerClient() : null;
  const [practiceResult, mockResult] =
    user && supabase
      ? await Promise.all([
          listPracticeAttempts(user.id, { client: supabase }),
          listMockAttempts(user.id, { client: supabase })
        ])
      : [
          { attempts: [], error: null },
          { attempts: [], error: null }
        ];
  const reviewItems =
    user && supabase
      ? buildReviewHistory({
          practiceAttempts: practiceResult.attempts,
          mockAttempts: mockResult.attempts
        })
      : [];
  const repositoryWarning =
    "error" in practiceResult && practiceResult.error
      ? practiceResult.error
      : "error" in mockResult && mockResult.error
        ? mockResult.error
        : null;

  return (
    <AppShell title="Review">
      <ReviewHistory
        initialItems={reviewItems}
        isSignedIn={Boolean(user)}
        repositoryWarning={repositoryWarning}
      />
    </AppShell>
  );
}
