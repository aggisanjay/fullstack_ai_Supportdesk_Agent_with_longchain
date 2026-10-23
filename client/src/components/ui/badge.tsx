import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "open" | "pending" | "resolved" | "escalated" | "positive" | "neutral" | "frustrated" | "critical" | "category" | "accent";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-[#F0EBE3] text-[#1C1916] border-[#E7DFD5]",
    open: "bg-[#EBF3FE] text-[#1D4ED8] border-[#BFDBFE]",
    pending: "bg-[#FEF3C7] text-[#A66314] border-[#FDE68A]",
    resolved: "bg-[#E6F4EA] text-[#26764F] border-[#A7F3D0]",
    escalated: "bg-[#FEE2E2] text-[#B83C35] border-[#FECACA]",
    positive: "bg-[#E6F4EA] text-[#26764F] border-[#A7F3D0]",
    neutral: "bg-[#F0EBE3] text-[#6D665F] border-[#E7DFD5]",
    frustrated: "bg-[#FEF3C7] text-[#A66314] border-[#FDE68A]",
    critical: "bg-[#FEE2E2] text-[#B83C35] border-[#FECACA]",
    category: "bg-[#FFF0E4] text-[#E85B00] border-[#FFD8BF]",
    accent: "bg-[#FF6B0A] text-[#1C1916] font-semibold border-transparent",
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
