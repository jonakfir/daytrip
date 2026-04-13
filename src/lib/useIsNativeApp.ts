"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    const cap = window.Capacitor;
    setIsNative(!!cap?.isNativePlatform?.());
  }, []);
  return isNative;
}
