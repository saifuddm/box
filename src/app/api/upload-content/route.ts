import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase/database.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boxId, name, base64Data, mimeType, uploadType, textContent } =
      body ?? {};

    if (!boxId || !uploadType) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: boxId and uploadType",
        }),
        { status: 400 }
      );
    }

    // Validate fields based on upload type
    if (uploadType === "text") {
      if (!textContent) {
        return new Response(
          JSON.stringify({ error: "Missing required field: textContent" }),
          { status: 400 }
        );
      }
    } else if (uploadType === "image" || uploadType === "file") {
      if (!name || !base64Data || !mimeType) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: name, base64Data, and mimeType",
          }),
          { status: 400 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid uploadType. Must be 'text', 'image', or 'file'",
        }),
        { status: 400 }
      );
    }

    // Verify token
    const cookieStore = await cookies();
    const token = cookieStore.get(`box_token_${boxId}`)?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, missing token" }),
        { status: 401 }
      );
    }

    // Verify JWT
    const secret = new TextEncoder().encode(process.env.BOX_TOKEN_SECRET);
    let payload;
    try {
      const result = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      payload = result.payload;
    } catch (error: any) {
      if (error?.code === "ERR_JWT_EXPIRED") {
        return new Response(
          JSON.stringify({ error: "Token expired, please authenticate again" }),
          { status: 401 }
        );
      }
      return new Response(
        JSON.stringify({ error: "Unauthorized, invalid token" }),
        { status: 401 }
      );
    }

    // Validate token scope and box ID
    if (payload.scope !== "box:read-write") {
      return new Response(
        JSON.stringify({ error: "Unauthorized, invalid scope" }),
        { status: 401 }
      );
    }

    const tokenBoxId = typeof payload.sub === "string" ? payload.sub : null;
    if (!tokenBoxId || boxId !== tokenBoxId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized, box ID does not match token",
        }),
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_NEXTJS_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let content;

    if (uploadType === "text") {
      // Handle text content - insert directly into database
      console.log(`Uploading text content to ${boxId}`);

      const { data: textData, error: textError } = await supabase
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
          { status: 500 }
        );
      }

      content = textData;
    } else {
      // Handle image/file content - upload to storage then insert into database
      console.log(`Uploading ${name} to ${boxId} with mime type ${mimeType}`);

      // Convert base64 to Buffer
      const base64Response = await fetch(base64Data);
      const blob = await base64Response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());

      // First, upload to the storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(uploadType === "image" ? "image-content" : "file-content")
        .upload(`${boxId}/${name}`, buffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        console.error("Error uploading:", uploadError);
        return new Response(
          JSON.stringify({ error: "Failed to upload to storage" }),
          { status: 500 }
        );
      }

      // Second, insert into the database
      const tableName = uploadType === "image" ? "ImageContent" : "FileContent";
      const { data: contentData, error: contentError } = await supabase
        .from(tableName as "ImageContent")
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
          { status: 500 }
        );
      }

      content = contentData;
    }

    return new Response(JSON.stringify({ data: content }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in upload-content API route:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
