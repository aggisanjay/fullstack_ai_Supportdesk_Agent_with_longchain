import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { fontSize: 10, fill: "#767c92", fontFamily: "JetBrains Mono, monospace" };
const TIP = {
  contentStyle: { background: "#0e1018ee", border: "1px solid #323852", borderRadius: 12, fontSize: 12, color: "#f4f1ea", backdropFilter: "blur(8px)" },
  labelStyle: { color: "#a3a8bb", fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
  cursor: { stroke: "#323852" },
};

export function TrendChart({ data }: { data: { date: string; resolved: number; escalated: number; total: number }[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5be3a8" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#5be3a8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gEsc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b0a" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ff6b0a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#242838" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...TIP} />
          <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#5be3a8" strokeWidth={2} fill="url(#gRes)" animationDuration={900} />
          <Area type="monotone" dataKey="escalated" name="Escalated" stroke="#ff6b0a" strokeWidth={2} fill="url(#gEsc)" animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IssuesChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={120} tick={{ ...AXIS, fill: "#c9c5bb" }} axisLine={false} tickLine={false} />
          <Tooltip {...TIP} cursor={{ fill: "#ffffff08" }} />
          <Bar dataKey="count" name="Tickets" radius={[0, 8, 8, 0]} barSize={14} animationDuration={900}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? "#ff6b0a" : `rgba(255,107,10,${Math.max(0.25, 0.8 - i * 0.16)})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with the headline value in the centre (confidence, deflection, …). */
export function ConfidenceDonut({ value, label, threshold }: { value: number; label: string; threshold?: number }) {
  const pct = Math.round(value * 100);
  const ok = threshold === undefined || value >= threshold;
  const data = [{ v: pct }, { v: 100 - pct }];
  return (
    <div className="relative h-60 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="v" innerRadius="68%" outerRadius="86%" startAngle={90} endAngle={-270} stroke="none" animationDuration={1000}>
            <Cell fill={ok ? "#5be3a8" : "#ff6b0a"} />
            <Cell fill="#151826" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-light tracking-tight text-[#f4f1ea]">{pct}%</div>
        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[#767c92]">{label}</div>
        {threshold !== undefined && <div className="mt-2 text-[10px] font-mono text-[#ffb066]">escalation floor {Math.round(threshold * 100)}%</div>}
      </div>
    </div>
  );
}

const PALETTE = ["#5ad1ff", "#5be3a8", "#ffb066", "#c9b6ff", "#ff8aa6"];
export function ProviderDonut({ dist }: { dist: Record<string, number> }) {
  const data = Object.entries(dist).map(([name, value]) => ({ name, value }));
  if (!data.length) return <div className="h-48 grid place-items-center text-xs text-[#767c92]">No requests yet</div>;
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none" animationDuration={900}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip {...TIP} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Per-request total latency; bar colour encodes the outcome. */
export function LatencyBars({ data }: { data: { id: string; ms: number; outcome: string }[] }) {
  const colour = (o: string) => (o === "success" ? "#5ad1ff" : o === "fallback" ? "#ffb066" : "#ff4d3d");
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#242838" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="id" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="ms" />
          <Tooltip {...TIP} cursor={{ fill: "#ffffff08" }} formatter={(v) => [`${v} ms`, "Latency"]} />
          <Bar dataKey="ms" radius={[4, 4, 0, 0]} animationDuration={800}>
            {data.map((d, i) => <Cell key={i} fill={colour(d.outcome)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
