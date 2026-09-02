import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "My Work | Performance Hub", description: "Notion-powered task performance dashboard" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
