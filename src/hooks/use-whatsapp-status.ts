import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkWhatsappStatus } from "@/lib/evolution.functions";

export function useWhatsappStatus(intervalMs = 30000) {
  const check = useServerFn(checkWhatsappStatus);
  const [status, setStatus] = useState<"connected" | "connecting" | "disconnected" | "unknown">("unknown");

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    async function run() {
      try {
        const r = await check();
        if (alive) setStatus((r.status as any) || "disconnected");
      } catch {
        if (alive) setStatus("disconnected");
      }
    }
    void run();
    timer = setInterval(() => { void run(); }, intervalMs);
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [check, intervalMs]);

  return status;
}
