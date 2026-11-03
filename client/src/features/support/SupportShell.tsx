import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { Activity, BarChart3, BookOpen, Inbox, LayoutDashboard } from "lucide-react";
import RunPipelinePanel from "./components/RunPipelinePanel";
import SupportModals from "./components/SupportModals";
import { SupportProvider } from "./SupportContext";
import { useSupport } from "./supportCtx";

const NAV = [
  { to: "/support/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/support/tickets", label: "Tickets", icon: Inbox, badge: "tickets" as const },
  { to: "/support/kb", label: "Knowledge Base", icon: BookOpen, badge: "kb" as const },
  { to: "/support/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/support/diagnostics", label: "Cost & Latency", icon: Activity },
];

function Sidebar() {
  const { user, tickets, kbArticles } = useSupport();
  const counts = { tickets: tickets.filter((t) => t.status !== "resolved").length, kb: kbArticles.length };
  return (
    <aside className="z-20 flex w-16 shrink-0 flex-col justify-between border-r border-[#242838] bg-[#0e1018] py-4 sm:w-56">
      <div className="space-y-4">
        <div className="hidden px-4 sm:block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#767c92]">Workspace</span>
        </div>
        <nav className="flex flex-col gap-1 px-2" aria-label="Support console">
          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive ? "border border-[#ff6b0a4d] bg-[#ff6b0a1a] text-[#ff8a3d]" : "border border-transparent text-[#a3a8bb] hover:bg-[#151826] hover:text-[#f4f1ea]"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </span>
              {badge && <span className="hidden rounded-full bg-[#151826] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#f4f1ea] sm:inline">{counts[badge]}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="hidden border-t border-[#242838] p-3 sm:block">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#ff6b0a4d] bg-[#ff6b0a1a] text-xs font-bold text-[#ff8a3d]">
            {user?.name?.slice(0, 2).toUpperCase() || "SU"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-[#f4f1ea]">{user?.name || "Support Lead"}</div>
            <div className="truncate font-mono text-[10px] text-[#767c92]">{user?.email || "team@company.com"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Frame() {
  const { pipeline, openTicketFromRun, retryRun } = useSupport();
  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#07080d] font-sans text-[#f4f1ea]">
      <Sidebar />
      <main className="flex min-w-0 flex-1 overflow-hidden bg-[#07080d]">
        <Outlet />
      </main>
      <SupportModals />
      <RunPipelinePanel run={pipeline.state} onClose={pipeline.reset} onOpenTicket={openTicketFromRun} onRetry={retryRun} />
    </div>
  );
}

/** /support, with nested routes: overview · tickets(/:id) · kb · analytics · diagnostics */
export default function SupportShell() {
  const { pathname } = useLocation();
  if (/^\/support\/?$/.test(pathname)) return <Navigate to="/support/tickets" replace />;
  return (
    <SupportProvider>
      <Frame />
    </SupportProvider>
  );
}
