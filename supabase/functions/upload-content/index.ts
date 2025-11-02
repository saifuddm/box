import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { JWTPayload, jwtVerify } from "npm:jose@6.1.0";
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
    // Verify token
    const token = req.headers.get("x-box-token");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, no authorization token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenBoxId = typeof payload.sub === "string" ? payload.sub : null;
    if (!tokenBoxId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, invalid token box ID" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const { boxId, name, base64Data, mimeType, uploadType, textContent } =
      await req.json();

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

    if (boxId !== tokenBoxId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized, box ID does not match token box ID",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      !uploadType ||
      (uploadType !== "image" && uploadType !== "file" && uploadType !== "text")
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Upload type is required and must be either image, file, or text",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate fields based on upload type
    if (uploadType === "text") {
      if (!textContent || typeof textContent !== "string") {
        return new Response(
          JSON.stringify({
            error: "Text content is required and must be a string",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      if (!base64Data || !mimeType) {
        return new Response(
          JSON.stringify({
            error:
              "Base64 data and mime type are required for image/file uploads",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let content;

    if (uploadType === "text") {
      // Handle text content - insert directly into database
      console.log(`Uploading text content to ${boxId} using token ${token}`);

      const { data: textData, error: textError } = await supabaseClient
        .from("TextContent")
        .insert({
          box: boxId,
          content: textContent,
        })
        .select("id, content, created_at")
        .single();

      if (textError) {
        console.error("Error inserting text:", textError);
        return new Response(
          JSON.stringify({ error: "Failed to insert text into database" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      content = textData;
    } else {
      // Handle image/file content - upload to storage then insert into database
      console.log(
        `Uploading ${name} to ${boxId} with mime type ${mimeType} using token ${token}`
      );

      // Convert base64 to blob
      const base64Response = await fetch(base64Data);
      const blob = await base64Response.blob();

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
      const { data: contentData, error: contentError } = await supabaseClient
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

      content = contentData;
    }

    return new Response(JSON.stringify({ data: content }), {
      status: 200,
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
