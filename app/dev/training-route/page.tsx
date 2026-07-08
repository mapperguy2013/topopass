import { AppShell } from "@/components/layout/AppShell";
import { buildPageMetadata } from "@/lib/seo";
import { TrainingRouteAuthorClient } from "./TrainingRouteAuthorClient";
import { DEV_TRAINING_ROUTE_AUTHOR_PATH } from "./trainingRouteAuthor";

export const metadata = buildPageMetadata({
  title: "Curated Training Route Author",
  description: "Dev-only interactive authoring, validation, preview, and export surface for curated learner training routes.",
  path: DEV_TRAINING_ROUTE_AUTHOR_PATH
});

export default function DevTrainingRouteAuthorPage() {
  return (
    <AppShell title="Training Route Author" frameClassName="max-w-[1900px]">
      <TrainingRouteAuthorClient />
    </AppShell>
  );
}
