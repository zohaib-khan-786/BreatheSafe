"use server";

import { cookies } from "next/headers";

export async function setTokens(accessToken: string, refreshToken: string) {
  (await cookies()).set("accessToken", accessToken, { httpOnly: true });
  (await cookies()).set("refreshToken", refreshToken, { httpOnly: true });
}

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get("accessToken")?.value ?? null;
}

export async function clearTokens() {
  (await cookies()).delete("accessToken");
  (await cookies()).delete("refreshToken");
}
