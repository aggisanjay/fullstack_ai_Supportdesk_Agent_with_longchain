import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "open" | "pending" | "resolved" | "escalated" | "positive" | "neutral" | "frustrated" | "critical" | "category" | "accent";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-[#151826] text-[#f4f1ea] border-[#242838]",
    open: "bg-[#5ad1ff1a] text-[#5ad1ff] border-[#5ad1ff40]",
    pending: "bg-[#ffb0661f] text-[#ffb066] border-[#ffb06640]",
    resolved: "bg-[#5be3a81a] text-[#5be3a8] border-[#5be3a840]",
    escalated: "bg-[#ff4d3d1f] text-[#ff8a7e] border-[#ff4d3d40]",
    positive: "bg-[#5be3a81a] text-[#5be3a8] border-[#5be3a840]",
    neutral: "bg-[#151826] text-[#a3a8bb] border-[#242838]",
    frustrated: "bg-[#ffb0661f] text-[#ffb066] border-[#ffb06640]",
    critical: "bg-[#ff4d3d1f] text-[#ff8a7e] border-[#ff4d3d40]",
    category: "bg-[#ff6b0a1a] text-[#E85B00] border-[#ff6b0a4d]",
    accent: "bg-[#FF6B0A] text-[#05060a] font-semibold border-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
