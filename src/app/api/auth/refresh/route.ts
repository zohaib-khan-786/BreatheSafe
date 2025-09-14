import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { refreshToken } = await req.json();

  // Fake validation: accept only "mock-refresh-token"
  if (refreshToken === "mock-refresh-token") {
    return NextResponse.json({
      accessToken: "new-mock-access-token",
      refreshToken: "mock-refresh-token", // or issue new one
    });
  }

  return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
}
