import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "human-control",
  description: "Visual agent workflow builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ height: "100%" }}>{children}</body>
    </html>
  );
}
