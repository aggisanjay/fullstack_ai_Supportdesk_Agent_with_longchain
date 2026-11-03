import { useEffect, useRef, useState } from "react";
import { TicketSculpture } from "./sculpture";

export type SceneApi = { setProgress: (p: number) => void };

/** Canvas that fills its (sticky) parent. The parent drives it with scroll progress 0..1. */
export default function Landing3D({ onReady }: { onReady: (api: SceneApi | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let scene: TicketSculpture | null = null;
    let cancelled = false;
    let io: IntersectionObserver | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || window.innerWidth < 760;

    // fonts first, so the ticket textures use Inter and JetBrains Mono
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (cancelled) return;
      try {
        scene = new TicketSculpture({ canvas, reduceMotion, lowEnd });
        const onResize = () => scene?.resize();
        window.addEventListener("resize", onResize);
        (canvas as unknown as { __off?: () => void }).__off = () => window.removeEventListener("resize", onResize);
        io = new IntersectionObserver(([e]) => scene?.setActive(e.isIntersecting), { rootMargin: "80px" });
        io.observe(canvas);
        onReady({ setProgress: (p) => scene?.setProgress(p) });
      } catch (e) {
        console.warn("WebGL unavailable, using static backdrop", e);
        setFailed(true);
        onReady(null);
      }
    });

    return () => {
      cancelled = true;
      io?.disconnect();
      (canvas as unknown as { __off?: () => void }).__off?.();
      scene?.dispose();
      onReady(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={`sd-canvas ${failed ? "is-failed" : ""}`} aria-hidden="true" />;
}
