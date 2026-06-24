import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TopoPass - TfL Topographical & SERU Practice",
    template: "%s | TopoPass"
  },
  description:
    "Practise London map skills, SERU-style knowledge, mock exams, and progress tracking for private hire preparation.",
  openGraph: {
    title: "TopoPass - TfL Topographical & SERU Practice",
    description:
      "Practise London map skills, SERU-style knowledge, mock exams, and progress tracking for private hire preparation.",
    siteName: "TopoPass",
    type: "website",
    images: [
      {
        url: "/social/topopass-social.svg",
        width: 1200,
        height: 630,
        alt: "TopoPass private hire learner practice"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "TopoPass - TfL Topographical & SERU Practice",
    description:
      "Practise London map skills, SERU-style knowledge, mock exams, and progress tracking for private hire preparation.",
    images: ["/social/topopass-social.svg"]
  }
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
