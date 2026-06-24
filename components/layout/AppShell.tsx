import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-road">
              TopoPass
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
