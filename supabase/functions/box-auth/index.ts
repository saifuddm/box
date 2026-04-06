import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim())
);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = allowedOrigins.has("*") || allowedOrigins.has(origin)
    ? (allowedOrigins.has("*") ? "*" : origin)
    : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

// Helper function to hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
console.log("Hello from Box Auth!");

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

Deno.serve(async (req) => {
  try {
    const { boxId, password } = await req.json();

    // Validate input
    if (!boxId || typeof boxId !== "string") {
      return new Response(
        JSON.stringify({ error: "Box ID is required and must be a string" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }

      // Hash the provided password and compare with stored hash (constant-time)
      const hashedPassword = await hashPassword(password);
      const isPasswordValid = constantTimeEqual(
        hashedPassword,
        box.password_hash ?? ""
      );

      if (!isPasswordValid) {
        console.log("Debugging (Password Validation):", isPasswordValid);
        return new Response(
          JSON.stringify({
            error: "Invalid password",
            requiresPassword: true,
          }),
          {
            status: 401,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
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
