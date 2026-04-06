import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { JWTPayload, jwtVerify } from "npm:jose@6.1.0";
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
// Helper function to fetch text content for a box
async function fetchTextContent(supabaseClient: any, boxId: string) {
  const { data, error } = await supabaseClient
    .from("TextContent")
    .select("id, content, created_at")
    .eq("box", boxId)
    .eq("hide_content", false)
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
    .eq("hide_content", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch image content: ${error.message}`);
  }

  return data.map((content: any) => ({
    ...content,
    type: "image",
  }));
}

// Helper function to fetch file content for a box
async function fetchFileContent(supabaseClient: any, boxId: string) {
  const { data, error } = await supabaseClient
    .from("FileContent")
    .select("id, content, created_at")
    .eq("box", boxId)
    .eq("hide_content", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch file content: ${error.message}`);
  }

  return data.map((content: any) => ({
    ...content,
    type: "file",
  }));
}

console.log("Hello from Get Box Content!");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    // Check for authorization header
    const token = req.headers.get("x-box-token");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, no authorization token" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
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
    } catch (error: any) {
      // Handle JWT expiration and invalid token errors
      // Check error code instead of instanceof since JWTExpired/JWTInvalid aren't exported
      if (error?.code === "ERR_JWT_EXPIRED") {
        return new Response(
          JSON.stringify({ error: "Token expired, please authenticate again" }),
          {
            status: 401,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      if (
        error?.code === "ERR_JWT_INVALID" ||
        error?.code === "ERR_JWT_CLAIM_VALIDATION_FAILED"
      ) {
        return new Response(
          JSON.stringify({ error: "Unauthorized, invalid token" }),
          {
            status: 401,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      // Re-throw other errors to be caught by outer catch block
      throw error;
    }

    if (payload.scope !== "box:read-write") {
      return new Response(
        JSON.stringify({ error: "Unauthorized, invalid scope" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const boxId = typeof payload.sub === "string" ? payload.sub : null;
    console.log(`Get box content request for box: ${boxId}`);
    if (!boxId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, invalid box ID" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch text, image and file content in parallel.
    const [textContent, imageContent, fileContent] = await Promise.all([
      fetchTextContent(supabaseClient, boxId),
      fetchImageContent(supabaseClient, boxId),
      fetchFileContent(supabaseClient, boxId),
    ]);

    // Combine and sort by created_at
    const contentWithType = [
      ...textContent,
      ...imageContent,
      ...fileContent,
    ].sort((a, b) => a.created_at.localeCompare(b.created_at));

    console.log(`Returning ${contentWithType.length} content items for box: ${boxId} (text: ${textContent.length}, images: ${imageContent.length}, files: ${fileContent.length})`);

    // Return the content
    return new Response(
      JSON.stringify({
        data: contentWithType,
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
