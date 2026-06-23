import { AppShell } from "@/components/layout/AppShell";
import { AdminDashboard } from "@/src/components/admin/AdminDashboard";

export default function AdminPage() {
  return <AppShell title="Admin Dashboard"><AdminDashboard /></AppShell>;
}
