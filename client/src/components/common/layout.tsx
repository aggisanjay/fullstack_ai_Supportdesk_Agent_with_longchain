import { Bot, LogOut, Sparkles, Activity } from "lucide-react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth";
import { useState } from "react";
import AuthModal from "./AuthModal";

export default function CommonLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, logout, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isDashboard = location.pathname.startsWith("/support");

  async function onlogout() {
    await logout();
    navigate("/");
  }

  const handleLogin = () => {
    if (user) {
      navigate("/support");
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans relative overflow-x-hidden selection:bg-violet-600 selection:text-white flex flex-col">
      {/* Background radial ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="glow-ambient hero-glow-indigo top-[-20%] left-[10%] w-[650px] h-[650px]" />
        <div className="glow-ambient hero-glow-violet top-[-10%] right-[15%] w-[600px] h-[600px]" />
      </div>

      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0A0A0F]/90 backdrop-blur-xl shrink-0">
        <div className="flex h-14 w-full items-center justify-between px-5 sm:px-6">
          
          {/* Brand Logo & Context Breadcrumb */}
          <div className="flex items-center gap-3.5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30 transition-transform group-hover:scale-105">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center">
                <span>SupportDesk</span>
                <span className="ml-1 text-violet-400">AI</span>
              </div>
            </Link>

            {isDashboard && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
                <span className="text-slate-500 font-mono">/</span>
                <span className="font-semibold text-slate-200">Agent Console</span>
              </div>
            )}
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-4">
            {isDashboard ? (
              <div className="flex items-center gap-3">
                {/* Active AI Agent Indicator */}
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Aria Live</span>
                </div>

                {/* User Initials & Name */}
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="h-7 w-7 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center font-bold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || "SU"}
                  </div>
                  <span className="hidden md:inline font-medium text-slate-300">
                    {user?.name || user?.email || "Support Lead"}
                  </span>
                </div>

                {/* Logout Button */}
                <Button 
                  onClick={onlogout}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
                  <a href="/#capabilities" className="hover:text-slate-100 transition-colors">Features</a>
                  <a href="/#how-it-works" className="hover:text-slate-100 transition-colors">How it works</a>
                  <a href="/#demo" className="hover:text-slate-100 transition-colors">Demo</a>
                  <a href="/#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
                  <a href="/#faq" className="hover:text-slate-100 transition-colors">FAQ</a>
                </nav>

                {!loading && user ? (
                  <Link
                    to="/support"
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-md shadow-violet-600/30 transition-all hover:scale-[1.02]"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Button
                    onClick={handleLogin}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-md shadow-violet-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Start free
                  </Button>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Outlet Container */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>

      {/* In-App Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
