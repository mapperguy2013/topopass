import type { Metadata } from "next";

const siteName = "PCO Ready";
const socialImage = "/social/pco-ready-social.svg";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function buildPageMetadata({
  title,
  description,
  path
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      siteName,
      type: "website",
      url: path,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "PCO Ready private hire assessment practice"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage]
    }
  };
}
