import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canvas - Advanced Agent Workspace",
  description:
    "A professional engineering-focused AI workspace shell with synchronized document viewers, range highlighting, and structured command threads.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
