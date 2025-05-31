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

// Helper function to fetch text content for a box
async function fetchTextContent(supabaseClient: any, boxId: string) {
  const { data, error } = await supabaseClient
    .from("TextContent")
    .select("id, content, created_at")
    .eq("box", boxId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch text content: ${error.message}`);
  }

  return data.map((content: any) => ({
    ...content,
    type: "text",
  }));
}

// Helper function to fetch image content for a box
async function fetchImageContent(supabaseClient: any, boxId: string) {
  const { data, error } = await supabaseClient
    .from("ImageContent")
    .select("id, content, created_at")
    .eq("box", boxId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch image content: ${error.message}`);
  }

  return data.map((content: any) => ({
    ...content,
    type: "image",
  }));
}

console.log("Hello from Get Box Content!");

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

      // Hash the provided password and compare with stored hash
      const hashedPassword = await hashPassword(password);
      const isPasswordValid = hashedPassword === box.password_hash;

      if (!isPasswordValid) {
        console.log("Debugging (Password Validation):", isPasswordValid);
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
    // Fetch both text and image content in parallel

    const [textContent, imageContent] = await Promise.all([
      fetchTextContent(supabaseClient, boxId),
      fetchImageContent(supabaseClient, boxId),
    ]);

    // Combine and sort by created_at
    const contentWithType = [...textContent, ...imageContent].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );

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
