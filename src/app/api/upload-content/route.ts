import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boxId, name, base64Data, mimeType, uploadType } = body ?? {};

    if (!boxId || !name || !base64Data || !mimeType || !uploadType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(`box_token_${boxId}`)?.value;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized, missing token" }),
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke("upload-content", {
      method: "POST",
      body: JSON.stringify({ boxId, name, base64Data, mimeType, uploadType }),
      headers: { "x-box-token": token },
    });

    if (error) {
      const message = await error.context.text();
      const status = error.context.status;
      return new Response(message, { status });
    }

    return new Response(JSON.stringify(data ?? null), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-content proxy error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
