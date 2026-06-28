import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Altuni Analyst - AI Investment Research Agent",
  description: "An automated AI-powered equity research analyst. Enter a company name to generate an end-to-end investment research report with live web searches and thesis synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
