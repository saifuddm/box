import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/utils/supabase/database.types";

const BOX_LIFETIME_MS = 24 * 60 * 60 * 1000;

function isTutorialBoxName(name: string) {
  return name.trim().toLowerCase() === "tutorial";
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateBoxToken(boxId: string): Promise<Response | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`box_token_${boxId}`)?.value;

  if (!token) {
    return jsonResponse({ error: "Unauthorized, missing token" }, 401);
  }

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
      return jsonResponse(
        { error: "Token expired, please authenticate again" },
        401,
      );
    }
    return jsonResponse({ error: "Unauthorized, invalid token" }, 401);
  }

  if (payload.scope !== "box:read-write") {
    return jsonResponse({ error: "Unauthorized, invalid scope" }, 401);
  }

  const tokenBoxId = typeof payload.sub === "string" ? payload.sub : null;
  if (!tokenBoxId || tokenBoxId !== boxId) {
    return jsonResponse(
      { error: "Unauthorized, box ID does not match token" },
      401,
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const boxId = typeof body?.boxId === "string" ? body.boxId : null;

    if (!boxId) {
      return jsonResponse({ error: "boxId is required" }, 400);
    }

    const authError = await validateBoxToken(boxId);
    if (authError) {
      return authError;
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_NEXTJS_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const expiredCreatedAt = new Date(
      Date.now() - BOX_LIFETIME_MS - 60 * 1000,
    ).toISOString();

    const { data: box, error: boxError } = await supabase
      .from("Box")
      .select("id, name")
      .eq("id", boxId)
      .single();

    if (boxError || !box) {
      console.error("Error finding box to mark for deletion:", boxError);
      return jsonResponse({ error: "Box not found" }, 404);
    }

    if (isTutorialBoxName(box.name)) {
      return jsonResponse({ error: "Tutorial box cannot be deleted" }, 403);
    }

    const { data, error } = await supabase
      .from("Box")
      .update({ created_at: expiredCreatedAt })
      .eq("id", boxId)
      .select("id, created_at")
      .single();

    if (error || !data) {
      console.error("Error marking box for deletion:", error);
      return jsonResponse({ error: "Failed to mark box for deletion" }, 500);
    }

    const cookieStore = await cookies();
    cookieStore.delete(`box_token_${boxId}`);

    return jsonResponse({ data }, 200);
  } catch (error) {
    console.error("Error in delete-box API route:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
