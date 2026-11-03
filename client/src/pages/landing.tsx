import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/auth";
import AuthModal from "@/components/common/AuthModal";
import StageSection from "@/components/landing/StageSection";
import { Bento, Closing, Faq, Manifesto, Stack } from "@/components/landing/Sections";
import "./landing.css";

const YEAR = new Date().getFullYear();

function Mark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#f4f1ea" strokeOpacity=".4" />
      <rect x="7" y="7" width="10" height="3" rx="1.5" fill="#f4f1ea" fillOpacity=".7" />
      <rect x="7" y="12" width="6" height="3" rx="1.5" fill="#ff6b0a" />
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lenis = useRef<Lenis | null>(null);

  const primary = () => (user ? navigate("/support") : setAuthOpen(true));
  const scrollToY = (y: number) => (lenis.current ? lenis.current.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: "smooth" }));
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY - 24);
  };
  const seeHow = (el: HTMLElement) => scrollToY(el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) * 0.26);

  useEffect(() => {
    document.documentElement.classList.add("sd-on");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (!reduce) {
      const l = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
      lenis.current = l;
      const tick = (t: number) => {
        l.raf(t);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.documentElement.classList.remove("sd-on");
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      lenis.current?.destroy();
      lenis.current = null;
    };
  }, []);

  return (
    <div className="sd">
      <nav className={`sd-nav ${scrolled ? "is-scrolled" : ""}`} aria-label="Primary">
        <button className="sd-brand" onClick={() => scrollToY(0)}><Mark /> SupportDesk<span>AI</span></button>
        <div className="sd-links">
          <button onClick={() => go("method")}>How it works</button>
          <button onClick={() => go("product")}>Product</button>
          <button onClick={() => go("stack")}>Stack</button>
          <button onClick={() => go("faq")}>FAQ</button>
        </div>
        <button className="sd-btn sd-btn-primary sd-btn-sm" onClick={primary}>{user ? "Open console" : "Sign in"} <ArrowUpRight size={14} /></button>
      </nav>

      <main>
        <StageSection signedIn={!!user} onPrimary={primary} onSeeHow={seeHow} />
        <Manifesto />
        <Bento />
        <Stack />
        <Faq />
        <Closing signedIn={!!user} onPrimary={primary} />
      </main>

      <footer className="sd-foot">
        <span>© {YEAR} SupportDesk AI</span>
        <div>
          <a href="https://github.com/aggisanjay/fullstack_ai_Supportdesk_Agent_with_longchain" target="_blank" rel="noreferrer">GitHub</a>
          <button onClick={primary}>{user ? "Console" : "Sign in"}</button>
        </div>
      </footer>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
