import { useState } from "react";
import { Bot, LogOut } from "lucide-react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth";
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
    <div className="min-h-screen bg-[#07080d] text-[#f4f1ea] font-sans relative flex flex-col selection:bg-[#ff6b0a1a] selection:text-[#f4f1ea]">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 border-b border-[#242838] bg-[#0e1018]/95 backdrop-blur-md shrink-0">
        <div className="flex h-14 w-full items-center justify-between px-5 sm:px-6">
          
          {/* Brand Logo & Context Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f1ea] text-[#FF6B0A] shadow-xs transition-transform group-hover:scale-105">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-bold tracking-tight text-[#f4f1ea] flex items-center">
                <span>SupportDesk</span>
                <span className="ml-1 text-[#FF6B0A]">AI</span>
              </div>
            </Link>

            {isDashboard && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#242838] text-xs text-[#a3a8bb]">
                <span className="text-[#767c92] font-mono">/</span>
                <span className="font-semibold text-[#f4f1ea]">Support Console</span>
              </div>
            )}
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            {isDashboard ? (
              <div className="flex items-center gap-3">
                {/* Active AI Agent Indicator */}
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#5be3a81a] border border-[#5be3a840] px-2.5 py-1 text-[11px] font-semibold text-[#5be3a8] font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5be3a8] animate-pulse" />
                  <span>Agent Copilot Active</span>
                </div>

                {/* User Initials & Name */}
                <div className="flex items-center gap-2 text-xs text-[#f4f1ea]">
                  <div className="h-7 w-7 rounded-lg bg-[#ff6b0a1a] border border-[#ff6b0a4d] text-[#E85B00] flex items-center justify-center font-bold text-xs">
                    {user?.name?.slice(0, 2).toUpperCase() || "SU"}
                  </div>
                  <span className="hidden md:inline font-medium text-[#f4f1ea]">
                    {user?.name || user?.email || "Support Operator"}
                  </span>
                </div>

                {/* Logout Button */}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={onlogout}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#a3a8bb]">
                  <a href="/#features" className="hover:text-[#f4f1ea] transition-colors">Features</a>
                  <a href="/#how-it-works" className="hover:text-[#f4f1ea] transition-colors">How it works</a>
                  <a href="/#demo" className="hover:text-[#f4f1ea] transition-colors">Demo</a>
                  <a href="/#security" className="hover:text-[#f4f1ea] transition-colors">Security</a>
                  <a href="/#faq" className="hover:text-[#f4f1ea] transition-colors">FAQ</a>
                </nav>

                {!loading && user ? (
                  <Link
                    to="/support"
                    className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#05060a] text-xs font-bold px-4 py-1.5 rounded-full shadow-xs transition-all"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Button
                    onClick={handleLogin}
                    size="sm"
                    className="bg-[#FF6B0A] hover:bg-[#E85B00] text-[#05060a] text-xs font-bold px-4 py-1.5 rounded-full shadow-xs"
                  >
                    Get started
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
