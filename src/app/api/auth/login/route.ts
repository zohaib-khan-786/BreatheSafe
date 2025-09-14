import { NextResponse } from "next/server";
import { setTokens } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (email === "test@test.com" && password === "123456") {
    // Normally call backend here
    await setTokens("mock-access-token", "mock-refresh-token");

    return NextResponse.json({ message: "Login success" });
  }

  return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
}
