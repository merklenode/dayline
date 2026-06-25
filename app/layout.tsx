import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dayline",
  description: "A daily focus system for tasks, deep work, and routine progress."
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
