import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import {
  createServiceRoleClient,
  insertTextContent,
  isBoxContentWriteError,
  uploadBinaryContent,
  validateTextContent,
  type BinaryUploadType,
} from "@/lib/box-content-write";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Always expect FormData for all uploads
    const formData = await request.formData();
    const boxId = formData.get("boxId") as string;
    const uploadType = formData.get("uploadType") as string;
    const textContent = formData.get("textContent") as string | null;
    const file = formData.get("file") as File | null;
    const hideContent = formData.get("hideContent") === "true";

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
      try {
        validateTextContent(textContent ?? "");
      } catch (error) {
        if (!isBoxContentWriteError(error)) {
          throw error;
        }

        return new Response(
          JSON.stringify({ error: error.message }),
          { status: error.status },
        );
      }
    } else if (uploadType === "image" || uploadType === "file") {
      if (!file) {
        return new Response(
          JSON.stringify({
            error: "Missing required field: file",
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
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === "ERR_JWT_EXPIRED") {
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

    const supabase = createServiceRoleClient();

    let content;

    if (uploadType === "text") {
      content = await insertTextContent(
        supabase,
        boxId,
        textContent ?? "",
        hideContent,
      );
    } else {
      const uploaded = await uploadBinaryContent(
        supabase,
        boxId,
        file!,
        hideContent,
        uploadType as BinaryUploadType,
      );
      content = uploaded.data;
    }

    return new Response(JSON.stringify({ data: content }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (isBoxContentWriteError(err)) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status,
      });
    }

    console.error("Error in upload-content API route:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
