import { Sparkles } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth";

export default function CommonLayout() {
  const navigate = useNavigate();
  const { loading, logout, user } = useAuth();

  async function onlogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background radial glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] opacity-15">
          <div className="absolute top-[-30%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600 blur-[120px]" />
          <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-600 blur-[130px]" />
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-6">
          <Link to="/">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 text-white shadow-sm shadow-indigo-500/10">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white">
                  Support Planner
                </div>
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {!loading && user ? (
              <Button 
                onClick={onlogout}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Logout
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1600px] px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
