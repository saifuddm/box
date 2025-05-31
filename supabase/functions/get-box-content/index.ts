// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { boxId, password } = await req.json();

    // Validate input
    if (!boxId || typeof boxId !== "string") {
      return new Response(
        JSON.stringify({ error: "Box ID is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ error: "Box not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify password
      if (!box.password_hash) {
        console.error("Box marked as protected but no password hash found");
        return new Response(
          JSON.stringify({ error: "Box configuration error" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Hash the provided password and compare with stored hash
      const hashedPassword = await hashPassword(password);
      const isPasswordValid = hashedPassword === box.password_hash;

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({
            error: "Invalid password",
            requiresPassword: true,
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // If we reach here, either the box is not protected or password is correct
    // Get all text content for this box
    const { data: textContent, error: contentError } = await supabaseClient
      .from("TextContent")
      .select("id, content, created_at")
      .eq("box", boxId)
      .order("created_at", { ascending: true });

    if (contentError) {
      console.error("Error fetching content:", contentError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch content" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all image content for this box
    const { data: imageContent, error: imageContentError } =
      await supabaseClient
        .from("ImageContent")
        .select("id, content, created_at")
        .eq("box", boxId)
        .order("created_at", { ascending: true });

    if (imageContentError) {
      console.error("Error fetching image content:", imageContentError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch image content" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Tag the content with the type
    const contentWithTypeText = textContent.map((content) => ({
      ...content,
      type: "text",
    }));

    const contentWithTypeImage = imageContent.map((content) => ({
      ...content,
      type: "image",
    }));

    // Combine and sort by created_at
    const contentWithType = [
      ...contentWithTypeText,
      ...contentWithTypeImage,
    ].sort((a, b) => a.created_at.localeCompare(b.created_at));

    // Return the content
    return new Response(
      JSON.stringify({
        data: contentWithType,
        boxInfo: {
          id: box.id,
          passwordProtected: box.password_protected,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-box-content' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
