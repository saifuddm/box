import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim()),
);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin =
    allowedOrigins.has("*") || allowedOrigins.has(origin)
      ? allowedOrigins.has("*")
        ? "*"
        : origin
      : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

// Take the leftmost IP from x-forwarded-for (the original client IP).
// Supabase's proxy may append its own address at the end.
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  ip: string,
  boxId: string,
): Promise<{ limited: boolean; retryAfterSeconds: number }> {
  const { data } = await supabaseClient
    .from("auth_rate_limits")
    .select("attempts, window_start")
    .eq("ip", ip)
    .eq("box_id", boxId)
    .single();

  if (!data) return { limited: false, retryAfterSeconds: 0 };

  const windowAgeMs = Date.now() - new Date(data.window_start).getTime();
  if (windowAgeMs > RATE_LIMIT_WINDOW_MS)
    return { limited: false, retryAfterSeconds: 0 };

  if (data.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - windowAgeMs) / 1000,
    );
    return { limited: true, retryAfterSeconds };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

async function recordFailedAttempt(
  supabaseClient: ReturnType<typeof createClient>,
  ip: string,
  boxId: string,
): Promise<void> {
  const { data: existing } = await supabaseClient
    .from("auth_rate_limits")
    .select("attempts, window_start")
    .eq("ip", ip)
    .eq("box_id", boxId)
    .single();

  const now = new Date().toISOString();

  if (!existing) {
    await supabaseClient
      .from("auth_rate_limits")
      .insert({ ip, box_id: boxId, attempts: 1, window_start: now });
    return;
  }

  const windowExpired =
    Date.now() - new Date(existing.window_start).getTime() >
    RATE_LIMIT_WINDOW_MS;

  if (windowExpired) {
    await supabaseClient
      .from("auth_rate_limits")
      .update({ attempts: 1, window_start: now })
      .eq("ip", ip)
      .eq("box_id", boxId);
  } else {
    await supabaseClient
      .from("auth_rate_limits")
      .update({ attempts: existing.attempts + 1 })
      .eq("ip", ip)
      .eq("box_id", boxId);
  }
}

console.log("Hello from Box Auth!");

Deno.serve(async (req) => {
  try {
    const { boxId, password } = await req.json();

    // Validate input
    if (!boxId || typeof boxId !== "string") {
      return new Response(
        JSON.stringify({ error: "Box ID is required and must be a string" }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // First, get the box to check if it's password protected
    const { data: box, error: boxError } = await supabaseClient
      .from("Box")
      .select("id, password_protected, password_hash")
      .eq("id", boxId)
      .single();

    if (boxError || !box) {
      console.error("Box not found:", boxError);
      console.log("Box ID:", boxId);
      console.log("Box:", box);
      return new Response(JSON.stringify({ error: "Box not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check if box is password protected
    if (box.password_protected) {
      // Password is required for protected boxes
      if (!password || typeof password !== "string") {
        return new Response(
          JSON.stringify({
            error: "Password is required for this protected box",
            requiresPassword: true,
          }),
          {
            status: 401,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }

      const ip = getClientIp(req);

      const { limited, retryAfterSeconds } = await checkRateLimit(
        supabaseClient,
        ip,
        boxId,
      );

      if (limited) {
        return new Response(
          JSON.stringify({
            error: "Too many failed password attempts. Please try again later.",
            requiresPassword: true,
          }),
          {
            status: 429,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
              "Retry-After": String(retryAfterSeconds),
            },
          },
        );
      }

      const hashedPassword = await hashPassword(password);
      const isPasswordValid = constantTimeEqual(
        hashedPassword,
        box.password_hash ?? "",
      );

      if (!isPasswordValid) {
        await recordFailedAttempt(supabaseClient, ip, boxId);
        return new Response(
          JSON.stringify({
            error: "Invalid password",
            requiresPassword: true,
          }),
          {
            status: 401,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }
    }

    console.log("Box authenticated");
    return new Response(JSON.stringify({ authenticated: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
