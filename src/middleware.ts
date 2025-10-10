import { NextRequest, NextResponse } from "next/server";

// Read DEV_MODE from environment, default to false when not provided
const isDevModeEnabled =
  (process.env.DEV_MODE ?? "false").toLowerCase() === "true";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extra guard even though matcher limits to /dev
  if (pathname.startsWith("/dev")) {
    if (!isDevModeEnabled) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  return NextResponse.next();
}

// Only run this middleware on /dev routes
export const config = {
  matcher: ["/dev/:path*"],
};
