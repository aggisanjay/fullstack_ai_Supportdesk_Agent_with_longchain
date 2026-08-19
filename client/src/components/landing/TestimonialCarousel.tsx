import { useState, useEffect } from "react";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarColor: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 0,
    quote:
      "We went from a 6-hour first response to under 30 seconds. Aria now closes 84% of inbound tickets before our team even sees them.",
    author: "Sarah Kim",
    role: "Head of Support",
    company: "Loopwear",
    avatarColor: "from-rose-500 to-violet-600",
    initials: "SK"
  },
  {
    id: 1,
    quote:
      "The knowledge sync was seamless. We connected Zendesk and Notion on a Tuesday, and by Friday our escalation rate dropped by half.",
    author: "Marcus Doyle",
    role: "CX Lead",
    company: "Freightline",
    avatarColor: "from-indigo-500 to-sky-600",
    initials: "MD"
  },
  {
    id: 2,
    quote:
      "The sentiment tracking and graceful human handoff gave our tier-2 engineers full confidence. It's like adding 10 agents overnight.",
    author: "Elena Rostova",
    role: "VP of Customer Operations",
    company: "PayStream",
    avatarColor: "from-emerald-500 to-teal-600",
    initials: "ER"
  },
  {
    id: 3,
    quote:
      "Our customers love getting verified answers in seconds at 2 AM on a Sunday. Best ROI on any tooling we've added this year.",
    author: "David Chen",
    role: "Co-Founder & COO",
    company: "Launchpad AI",
    avatarColor: "from-amber-500 to-orange-600",
    initials: "DC"
  }
];

export default function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const current = TESTIMONIALS[activeIndex];

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="text-xs font-bold tracking-widest text-violet-400 uppercase">
          06 — SOCIAL PROOF
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
          Support teams, unburied.
        </h2>
      </div>

      <div className="relative w-full rounded-3xl border border-slate-800/90 bg-[#0B0F19]/90 backdrop-blur-xl p-8 sm:p-12 shadow-2xl overflow-hidden min-h-[260px] flex flex-col justify-between transition-all">
        {/* Big decorative quotation mark watermark */}
        <div className="absolute top-6 right-8 select-none pointer-events-none text-7xl sm:text-9xl font-serif text-violet-500/10 leading-none">
          “
        </div>

        {/* Testimonial Quote */}
        <div className="relative z-10">
          <p className="text-lg sm:text-2xl font-normal text-slate-100 leading-relaxed max-w-4xl tracking-tight">
            "{current.quote}"
          </p>
        </div>

        {/* Author details & pagination */}
        <div className="relative z-10 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-full bg-gradient-to-br ${current.avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow-md`}
            >
              {current.initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {current.author}
              </div>
              <div className="text-xs text-slate-400">
                {current.role}, {current.company}
              </div>
            </div>
          </div>

          {/* 4 Pagination indicators (active = elongated pill) */}
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeIndex
                    ? "w-7 h-1.5 bg-violet-500"
                    : "w-1.5 h-1.5 bg-slate-700 hover:bg-slate-600"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
