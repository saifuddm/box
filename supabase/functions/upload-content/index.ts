import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("Hello from Upload Image!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { boxId, name, base64Data, mimeType, uploadType } = await req.json();

    //Validate input
    if (!boxId || typeof boxId !== "string") {
      return new Response(
        JSON.stringify({ error: "Box ID is required and must be a string" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!base64Data || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Image data and mime type are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!uploadType || (uploadType !== "image" && uploadType !== "file")) {
      return new Response(
        JSON.stringify({
          error: "Upload type is required and must be either image or file",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();

    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First, upload to the storage bucket
    const { data: uploadData, error: uploadError } =
      await supabaseClient.storage
        .from(uploadType === "image" ? "image-content" : "file-content")
        .upload(`${boxId}/${name}`, blob, {
          contentType: mimeType,
        });

    if (uploadError) {
      console.error("Error uploading:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload to storage" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Second, insert into the database
    const { data: content, error: contentError } = await supabaseClient
      .from(uploadType === "image" ? "ImageContent" : "FileContent")
      .insert({
        box: boxId,
        content: uploadData.path,
      })
      .select("id, content, created_at")
      .single();

    if (contentError) {
      console.error("Error inserting:", contentError);
      return new Response(
        JSON.stringify({ error: "Failed to insert into database" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ data: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in upload function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
