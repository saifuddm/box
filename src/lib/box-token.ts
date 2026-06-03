import { SignJWT } from "jose";
import { cookies } from "next/headers";

async function createBoxToken(boxId: string, rememberPassword = true) {
  const secret = new TextEncoder().encode(process.env.BOX_TOKEN_SECRET);

  return new SignJWT({ scope: "box:read-write" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(boxId)
    .setIssuedAt()
    .setExpirationTime(rememberPassword ? "24h" : "1h")
    .sign(secret);
}

async function setBoxTokenCookie(boxId: string, rememberPassword = true) {
  const cookieStore = await cookies();
  const token = await createBoxToken(boxId, rememberPassword);

  cookieStore.set(`box_token_${boxId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberPassword ? 60 * 60 * 24 : 60 * 60,
    path: "/",
  });

  return token;
}

export { createBoxToken, setBoxTokenCookie };
