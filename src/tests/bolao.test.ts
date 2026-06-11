import { describe, test, expect, mock, spyOn, beforeAll, afterAll } from "bun:test";
import { fmtBRL, flag, countdown, callFn } from "@/lib/bolao";

describe("Bolão Copa 2026 — Client Utilities", () => {
  test("fmtBRL formats numbers to BRL currency format", () => {
    // Note: BRL formatting can have non-breaking spaces depending on JS environment.
    // We replace them with normal spaces for robust comparisons or just match numbers.
    const result = fmtBRL(10).replace(/\u00a0/g, " ").replace(/\s/g, " ");
    expect(result).toContain("R$");
    expect(result).toContain("10,00");
  });

  test("flag retrieves the correct emoji banner", () => {
    expect(flag("Brazil")).toBe("🇧🇷");
    expect(flag("Brasil")).toBe("🇧🇷");
    expect(flag("USA")).toBe("🇺🇸");
    expect(flag("InvalidCountryName")).toBe("⚽");
    expect(flag(null)).toBe("⚽");
    expect(flag(undefined)).toBe("⚽");
  });

  test("countdown computes time correctly", () => {
    // Past date
    const past = new Date(Date.now() - 10000);
    expect(countdown(past)).toBe("Encerrado");

    // Future date
    const oneDayFuture = new Date(Date.now() + 86400000 + 3600000 * 2); // 1 day and 2 hours
    const cd = countdown(oneDayFuture);
    expect(cd).toContain("1d");

    const minutesFuture = new Date(Date.now() + 60000 * 45); // 45 minutes
    const cdMinutes = countdown(minutesFuture);
    expect(cdMinutes).toBe("45min");
  });
});

describe("Bolão Copa 2026 — API callFn logic", () => {
  // Mock VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY if they don't exist in testing env
  beforeAll(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      import.meta.env.VITE_SUPABASE_URL = "https://mock-supabase.co";
    }
    if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "mock-key";
    }
  });

  test("callFn returns json data on successful response", async () => {
    const originalFetch = global.fetch;
    global.fetch = mock(async () => {
      return new Response(JSON.stringify({ ok: true, data: "test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      const res = await callFn("usuarios", { action: "create" }, "POST", 0);
      expect(res.ok).toBe(true);
      expect(res.data).toBe("test");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("callFn retries on error and respects backoff", async () => {
    const originalFetch = global.fetch;
    let callCount = 0;
    
    global.fetch = mock(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify({ error: "Temporary Error" }), {
          status: 500,
        });
      }
      return new Response(JSON.stringify({ ok: true, success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      const start = Date.now();
      const res = await callFn("usuarios", {}, "POST", 1);
      const duration = Date.now() - start;

      expect(callCount).toBe(2);
      expect(res.success).toBe(true);
      // Backoff delay for 1st retry is 800ms
      expect(duration).toBeGreaterThanOrEqual(750);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("callFn throws error after exceeding retries", async () => {
    const originalFetch = global.fetch;
    let callCount = 0;
    
    global.fetch = mock(async () => {
      callCount++;
      return new Response(JSON.stringify({ error: "Failed permanently" }), {
        status: 400,
      });
    }) as any;

    try {
      await expect(callFn("usuarios", {}, "POST", 1)).rejects.toThrow("Failed permanently");
      expect(callCount).toBe(2); // Initial try + 1 retry
    } finally {
      global.fetch = originalFetch;
    }
  });
});
