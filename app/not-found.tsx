import { StatusPage } from "@/src/components/status/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      message="The page you requested does not exist or is not available in this environment."
      primaryHref="/practice"
      primaryLabel="Go to practice"
      secondaryHref="/"
      secondaryLabel="Go home"
      title="Page not found"
    />
  );
}
