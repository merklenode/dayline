import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focus Ledger",
  description: "A simple time management app for daily focus, tasks, and progress."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-zinc-950 antialiased">{children}</body>
    </html>
  );
}
