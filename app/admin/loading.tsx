import { LoadingPage } from "@/src/components/status/StatusPage";

export default function AdminLoading() {
  return (
    <LoadingPage
      message="Checking admin access and loading the protected tools."
      title="Loading admin"
    />
  );
}
