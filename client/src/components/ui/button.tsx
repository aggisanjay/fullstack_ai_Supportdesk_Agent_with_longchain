import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B0A] focus-visible:ring-offset-2 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF6B0A] text-[#05060a] font-semibold hover:bg-[#E85B00] shadow-sm active:translate-y-px",
        destructive:
          "bg-[#ff4d3d] text-white hover:bg-[#ff6657] shadow-sm",
        outline:
          "border border-[#242838] bg-[#0e1018] text-[#f4f1ea] hover:bg-[#ff6b0a1a] hover:border-[#FF6B0A]/40 shadow-xs",
        secondary:
          "bg-[#151826] text-[#f4f1ea] hover:bg-[#242838] border border-[#242838]/60",
        ghost:
          "hover:bg-[#151826] text-[#f4f1ea]",
        link:
          "text-[#FF6B0A] underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4 text-base",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
