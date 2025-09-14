import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import TopBar from "@/components/TopBar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Breathe Safe++",
  description: "Created By Zohaib Khan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased h-[100dvh] w-[100dvw] overflow-x-hidden`}
      ><AuthProvider>
        <ThemeProvider attribute={"class"} defaultTheme="light" enableSystem>
          <TopBar />
          {children}
        </ThemeProvider>
      </AuthProvider>
      </body>
    </html>
  );
}
