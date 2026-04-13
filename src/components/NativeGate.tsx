"use client";

import type { ReactNode } from "react";
import { useIsNativeApp } from "@/lib/useIsNativeApp";

export function HideOnNative({ children }: { children: ReactNode }) {
  const isNative = useIsNativeApp();
  if (isNative) return null;
  return <>{children}</>;
}
