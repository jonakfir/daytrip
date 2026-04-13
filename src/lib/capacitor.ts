"use client";

type HapticsStyle = "LIGHT" | "MEDIUM" | "HEAVY";

interface CapacitorPlugins {
  Haptics?: {
    impact?: (opts: { style: HapticsStyle }) => Promise<void>;
    notification?: (opts: { type: "SUCCESS" | "WARNING" | "ERROR" }) => Promise<void>;
  };
  Share?: {
    share: (opts: {
      title?: string;
      text?: string;
      url?: string;
      dialogTitle?: string;
    }) => Promise<void>;
  };
}

function plugins(): CapacitorPlugins | undefined {
  if (typeof window === "undefined") return undefined;
  const cap = window.Capacitor as unknown as {
    isNativePlatform?: () => boolean;
    Plugins?: CapacitorPlugins;
  } | undefined;
  if (!cap?.isNativePlatform?.()) return undefined;
  return cap.Plugins;
}

export async function hapticTap(style: HapticsStyle = "LIGHT"): Promise<void> {
  try {
    await plugins()?.Haptics?.impact?.({ style });
  } catch {
    // silently ignore — haptics are best-effort
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    await plugins()?.Haptics?.notification?.({ type: "SUCCESS" });
  } catch {
    // ignore
  }
}

export async function nativeShare(opts: {
  title?: string;
  text?: string;
  url: string;
}): Promise<boolean> {
  const share = plugins()?.Share?.share;
  if (!share) return false;
  try {
    await share({
      title: opts.title,
      text: opts.text,
      url: opts.url,
      dialogTitle: opts.title,
    });
    return true;
  } catch {
    return false;
  }
}
