import { LoadingPage } from "@/src/components/status/StatusPage";

export default function AccountLoading() {
  return (
    <LoadingPage
      message="Checking your session and loading the account summary."
      title="Loading account"
    />
  );
}
