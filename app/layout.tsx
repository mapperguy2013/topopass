import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopoPass",
  description:
    "Interactive practice for the TfL Private Hire Topographical Skills Assessment."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
