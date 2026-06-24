import { LoadingPage } from "@/src/components/status/StatusPage";

export default function QuestionImportExportLoading() {
  return (
    <LoadingPage
      message="Preparing question import and export tools."
      title="Loading import/export"
    />
  );
}
