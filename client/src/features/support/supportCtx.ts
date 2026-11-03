import { createContext, useContext } from "react";
import type { useSupportState } from "./SupportContext";

export type SupportValue = ReturnType<typeof useSupportState>;
export const SupportCtx = createContext<SupportValue | null>(null);

export function useSupport() {
  const v = useContext(SupportCtx);
  if (!v) throw new Error("useSupport must be used inside <SupportProvider>");
  return v;
}
