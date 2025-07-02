import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "DMGPT5e",
  description: "A complete Dungeons & Dragons 5th Edition character creator and DM assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
