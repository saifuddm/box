import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

type UploadType = "image" | "file";

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateBoxToken(
  boxId: string
): Promise<{ token: string } | { response: Response }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`box_token_${boxId}`)?.value;
  if (!token) {
    return {
      response: jsonResponse({ error: "Unauthorized, missing token" }, 401),
    };
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
      return {
        response: jsonResponse(
          { error: "Token expired, please authenticate again" },
          401
        ),
      };
    }
    return {
      response: jsonResponse({ error: "Unauthorized, invalid token" }, 401),
    };
  }

  if (payload.scope !== "box:read-write") {
    return {
      response: jsonResponse({ error: "Unauthorized, invalid scope" }, 401),
    };
  }

  const tokenBoxId = typeof payload.sub === "string" ? payload.sub : null;
  if (!tokenBoxId || tokenBoxId !== boxId) {
    return {
      response: jsonResponse(
        { error: "Unauthorized, box ID does not match token" },
        401
      ),
    };
  }

  return { token };
}

async function fetchSignedUrl(path: string, uploadType: UploadType, token: string) {
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
    return {
      ok: false as const,
      response: new Response(message, {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const signedUrl =
    response.data &&
    typeof response.data === "object" &&
    "signedUrl" in response.data
      ? (response.data as { signedUrl?: string }).signedUrl
      : null;

  if (!signedUrl) {
    return {
      ok: false as const,
      response: jsonResponse({ error: "Missing signed URL in response" }, 500),
    };
  }

  return { ok: true as const, signedUrl };
}

function parseUploadType(value: string | null): UploadType | null {
  if (value === "image" || value === "file") {
    return value;
  }
  return null;
}

function validatePathForBox(path: string, boxId: string) {
  return path.startsWith(`${boxId}/`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = typeof body?.path === "string" ? body.path : null;
    const boxId = typeof body?.boxId === "string" ? body.boxId : null;
    const uploadType = parseUploadType(body?.uploadType ?? null);

    if (!path || !boxId || !uploadType) {
      return jsonResponse({ error: "path, boxId and uploadType are required" }, 400);
    }

    if (!validatePathForBox(path, boxId)) {
      return jsonResponse({ error: "Path does not match requested box ID" }, 400);
    }

    const authResult = await validateBoxToken(boxId);
    if ("response" in authResult) {
      return authResult.response;
    }

    const signedResult = await fetchSignedUrl(path, uploadType, authResult.token);
    if (!signedResult.ok) {
      return signedResult.response;
    }

    return jsonResponse({ signedUrl: signedResult.signedUrl }, 200);
  } catch (error) {
    console.error("Error in storage-content API route:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const boxId = searchParams.get("boxId");
    const path = searchParams.get("path");
    const uploadType = parseUploadType(searchParams.get("uploadType"));

    if (!boxId || !path || !uploadType) {
      return jsonResponse({ error: "boxId, path and uploadType are required" }, 400);
    }

    if (!validatePathForBox(path, boxId)) {
      return jsonResponse({ error: "Path does not match requested box ID" }, 400);
    }

    const authResult = await validateBoxToken(boxId);
    if ("response" in authResult) {
      return authResult.response;
    }

    const signedResult = await fetchSignedUrl(path, uploadType, authResult.token);
    if (!signedResult.ok) {
      return signedResult.response;
    }

    return Response.redirect(signedResult.signedUrl, 302);
  } catch (error) {
    console.error("Error in storage-content GET route:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
