import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = typeof body?.path === "string" ? body.path : null;
    const boxId = typeof body?.boxId === "string" ? body.boxId : null;
    const uploadType =
      body?.uploadType === "image" || body?.uploadType === "file"
        ? body.uploadType
        : null;

    if (!path || !boxId || !uploadType) {
      return new Response(
        JSON.stringify({ error: "path, boxId and uploadType are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!path.startsWith(`${boxId}/`)) {
      return new Response(
        JSON.stringify({ error: "Path does not match requested box ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(`box_token_${boxId}`)?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized, missing token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify token before forwarding to edge function.
    const secret = new TextEncoder().encode(process.env.BOX_TOKEN_SECRET ?? "");
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
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "Unauthorized, invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payload.scope !== "box:read-write") {
      return new Response(JSON.stringify({ error: "Unauthorized, invalid scope" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenBoxId = typeof payload.sub === "string" ? payload.sub : null;
    if (!tokenBoxId || tokenBoxId !== boxId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, box ID does not match token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = await createClient();
    const response = await supabase.functions.invoke("get-storage-content", {
      body: { path, uploadType },
      headers: { "x-box-token": token },
    });

    if (response.error) {
      const message = response.error.context
        ? await response.error.context.text()
        : JSON.stringify({ error: response.error.message });
      const status = response.error.context?.status ?? 500;
      return new Response(message, {
        status: status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in storage-content API route:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
