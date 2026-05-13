import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface PeriodStats {
  tokens_used: number;
  percent: number;
  reset_in_secs: number | null;
  max_tokens: number;
}

export interface UsageStats {
  current: PeriodStats;
  weekly: PeriodStats;
}

// Actual API shape (confirmed):
// { five_hour: { utilization: 2, resets_at: "..." }, seven_day: { utilization: 3, resets_at: "..." }, ... }
// utilization is an integer percentage (2 = 2%).
function extractOAuthPercents(
  raw: unknown
): { current: number; weekly: number; resetCurrent?: number; resetWeekly?: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const win5h =
    (d.five_hour as any) ??
    (d.period_5h as any) ??
    (d["5h"] as any) ??
    (d.rolling_window_5h as any) ??
    (d.current_period as any);

  const winWeekly =
    (d.seven_day as any) ??
    (d.weekly as any) ??
    (d.period_weekly as any) ??
    (d.weekly_period as any) ??
    (d.weekly_window as any);

  if (!win5h || !winWeekly) return null;

  // utilization is an integer percent (2 → 2%); also handle 0-1 decimals
  const pct = (v: any): number | null => {
    const val = v?.utilization ?? v?.percent ?? v?.percent_used ?? v?.percentUsed;
    const n = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(n)) return null;
    return n > 0 && n < 1 ? n * 100 : n;
  };

  const toResetSecs = (v: any): number | undefined => {
    if (!v?.resets_at) return undefined;
    const ms = new Date(v.resets_at).getTime() - Date.now();
    return ms > 0 ? Math.floor(ms / 1000) : undefined;
  };

  const cp = pct(win5h);
  const wp = pct(winWeekly);
  if (cp === null || wp === null) return null;

  return { current: cp, weekly: wp, resetCurrent: toResetSecs(win5h), resetWeekly: toResetSecs(winWeekly) };
}

export function useUsage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<UsageStats>("get_usage_stats");

      // Override with authoritative OAuth percentages and reset times.
      try {
        const oauthRaw = await invoke<unknown>("get_oauth_usage");
        const o = extractOAuthPercents(oauthRaw);
        if (o) {
          data.current.percent = o.current;
          data.current.tokens_used = Math.round(o.current / 100 * data.current.max_tokens);
          data.weekly.percent = o.weekly;
          data.weekly.tokens_used = Math.round(o.weekly / 100 * data.weekly.max_tokens);
          if (o.resetCurrent !== undefined) data.current.reset_in_secs = o.resetCurrent;
          if (o.resetWeekly !== undefined) data.weekly.reset_in_secs = o.resetWeekly;
        }
      } catch {
        // OAuth unavailable — JSONL-based values remain.
      }

      setStats(data);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    const unlisten = listen("usage-updated", refresh);

    return () => {
      clearInterval(interval);
      unlisten.then((fn) => fn());
    };
  }, [refresh]);

  return { stats, loading, error, refresh };
}
