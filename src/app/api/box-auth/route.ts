import { createClient } from "@/utils/supabase/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Request received", request);
    return new Response("Hello, world!", { status: 200 });
  } catch (err) {
    console.error("Error", err);
    return new Response("Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { boxId, password } = await request.json();
  const cookieStore = await cookies();
  console.log("request received", request);
  const supabase = await createClient();

  const response = await supabase.functions.invoke("box-auth", {
    body: { boxId: boxId, password: password || "" },
  });
  if (response.error) {
    const message = await response.error.context.text();
    const status = await response.error.context.status;
    const errorMessage = JSON.parse(message);

    console.log("Error message:", errorMessage.error);

    return new Response(JSON.stringify(errorMessage), { status: status });
  }

  const secret = new TextEncoder().encode(process.env.BOX_TOKEN_SECRET);
  const token = await new SignJWT({ scope: "box:read" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(boxId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  cookieStore.set(`box_token_${boxId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });

  return new Response(null, { status: 200 });
}
