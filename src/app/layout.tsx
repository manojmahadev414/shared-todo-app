import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared To-Do",
  description: "A calm place to organize tasks with people you trust.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
