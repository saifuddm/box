import { createClient } from "@/utils/supabase/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { boxId, password, rememberPassword } = await request.json();
  const cookieStore = await cookies();
  const supabase = await createClient();

  const response = await supabase.functions.invoke("box-auth", {
    body: { boxId: boxId, password: password || "" },
  });
  if (response.error) {
    const message = await response.error.context.text();
    const status = await response.error.context.status;
    const errorMessage = JSON.parse(message);

    return new Response(JSON.stringify(errorMessage), { status: status });
  }

  const secret = new TextEncoder().encode(process.env.BOX_TOKEN_SECRET);
  const token = await new SignJWT({ scope: "box:read-write" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(boxId)
    .setIssuedAt()
    .setExpirationTime(rememberPassword ? "24h" : "1h")
    .sign(secret);

  cookieStore.set(`box_token_${boxId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberPassword ? 60 * 60 * 24 : 60 * 60,
    path: "/",
  });

  return new Response(null, { status: 200 });
}
