import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { path, uploadType } = await req.json();

    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create signed URL
    const { data: signedUrl, error: signedUrlError } =
      await supabaseClient.storage
        .from(uploadType === "image" ? "image-content" : "file-content")
        .createSignedUrl(path, 3600);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to create signed URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fix the URL for local development
    let finalSignedUrl = signedUrl.signedUrl;

    // Replace internal Docker URL with localhost for local development
    if (finalSignedUrl.includes("kong:8000")) {
      finalSignedUrl = finalSignedUrl.replace(
        "http://kong:8000",
        "http://localhost:54321"
      );
    }

    // Return the content
    return new Response(JSON.stringify({ signedUrl: finalSignedUrl }), {
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
