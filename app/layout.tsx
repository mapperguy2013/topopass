import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://pcoready.co.uk"
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PCO Ready - TfL Topographical & SERU Practice",
    template: "%s | PCO Ready"
  },
  description:
    "Prepare for the TfL Topographical and SERU assessments with map-based practice, mock-style questions, explanations, and progress tracking.",
  openGraph: {
    title: "PCO Ready - TfL Topographical & SERU Practice",
    description:
      "Prepare for the TfL Topographical and SERU assessments with map-based practice, mock-style questions, explanations, and progress tracking.",
    siteName: "PCO Ready",
    type: "website",
    images: [
      {
        url: "/social/pco-ready-social.svg",
        width: 1200,
        height: 630,
        alt: "PCO Ready private hire assessment practice"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "PCO Ready - TfL Topographical & SERU Practice",
    description:
      "Prepare for the TfL Topographical and SERU assessments with map-based practice, mock-style questions, explanations, and progress tracking.",
    images: ["/social/pco-ready-social.svg"]
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
