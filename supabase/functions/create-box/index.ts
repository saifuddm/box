import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Derive a PBKDF2 hash from a password with a random salt.
// Returns a string in the format: pbkdf2:{salt_hex}:{hash_hex}
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, hash: "SHA-256", iterations: 310_000 },
    keyMaterial,
    256,
  );

  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return `pbkdf2:${toHex(salt.buffer)}:${toHex(hashBuffer)}`;
}

console.log("Hello from Create Box!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { name, password } = await req.json();
    // Validate input
    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Name is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedName = name.trim().toLowerCase();

    // Reserve "tutorial" (case-insensitive) for the system tutorial box
    if (normalizedName === "tutorial") {
      return new Response(
        JSON.stringify({
          error:
            "You cannot create a box with the name 'Tutorial'. Please choose a different name.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    let passwordHash = null;
    const passwordProtected = Boolean(password);

    // Hash password if provided
    if (password && typeof password === "string") {
      // Hash password using Web Crypto API
      passwordHash = await hashPassword(password);
    }

    const { data, error } = await supabaseClient
      .from("Box")
      .insert({
        name: name,
        password_protected: passwordProtected,
        password_hash: passwordHash,
      })
      .select("id, name, created_at, password_protected")
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Failed to create box" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Box created: ${data.id} (${data.name}), password_protected: ${data.password_protected}`);

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
