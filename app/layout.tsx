import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hanstaiger · Book the X1",
  description:
    "Charter the Hanstaiger X1. Select your dates, your guests, and tailor your experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
