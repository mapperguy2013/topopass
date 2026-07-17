import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
  frameClassName?: string;
  framePaddingClassName?: string;
  mainClassName?: string;
  focusMode?: {
    label: string;
    exitHref: string;
    exitLabel: string;
  };
};

export function AppShell({
  title,
  children,
  frameClassName = "max-w-[1500px]",
  framePaddingClassName = "px-4 py-6 sm:px-6 lg:px-8",
  mainClassName = "",
  focusMode
}: AppShellProps) {
  if (focusMode) {
    return (
      <div className="min-h-screen bg-slate-100" data-app-shell-mode="focus">
        <header className="border-b border-slate-300 bg-slate-950 text-white">
          <div
            className={`mx-auto flex min-h-16 ${frameClassName} items-center justify-between gap-4 px-3 sm:px-6 lg:px-8`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded bg-white text-xs font-bold text-slate-950">
                TP
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase text-slate-400">TopoPass</p>
                <p className="truncate text-sm font-semibold text-white">{focusMode.label}</p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded border border-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href={focusMode.exitHref}
            >
              {focusMode.exitLabel}
            </Link>
          </div>
        </header>
        <main className={`mx-auto min-w-0 ${frameClassName} ${framePaddingClassName} ${mainClassName}`}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div
        className={`mx-auto flex ${frameClassName} gap-6 ${framePaddingClassName}`}
        data-app-shell-frame
      >
        <div data-app-sidebar>
          <Sidebar />
        </div>
        <main className={`min-w-0 flex-1 ${mainClassName}`}>
          <div className="mb-6" data-app-shell-heading>
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
