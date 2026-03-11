import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { JWTPayload, jwtVerify } from "npm:jose@6.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-box-token",
};

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = req.headers.get("x-box-token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized, missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = new TextEncoder().encode(
      Deno.env.get("BOX_TOKEN_SECRET") ?? ""
    );

    let payload: JWTPayload;
    try {
      const result = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      payload = result.payload;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === "ERR_JWT_EXPIRED") {
        return new Response(
          JSON.stringify({ error: "Token expired, please authenticate again" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ error: "Unauthorized, invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.scope !== "box:read-write") {
      return new Response(JSON.stringify({ error: "Unauthorized, invalid scope" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boxId = typeof payload.sub === "string" ? payload.sub : null;
    if (!boxId) {
      return new Response(JSON.stringify({ error: "Unauthorized, invalid box ID" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const path = typeof body?.path === "string" ? body.path : null;
    const uploadType =
      body?.uploadType === "image" || body?.uploadType === "file"
        ? body.uploadType
        : null;

    if (!path || !uploadType) {
      return new Response(
        JSON.stringify({ error: "path and uploadType are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!path.startsWith(`${boxId}/`)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, path does not match token box" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
