import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareContentPage from "@/components/ShareContentPage";
import { appReelDeepLink } from "@/lib/site";
import {
  buildVideoShareMeta,
  fetchVideoById,
  isValidVideoId,
} from "@/lib/videos";

type PageProps = {
  params: Promise<{ reelId: string }>;
};

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { reelId } = await params;

  if (!isValidVideoId(reelId)) {
    return {
      title: "Reel not found | FuntApp",
      robots: { index: false, follow: false },
    };
  }

  const video = await fetchVideoById(reelId);
  if (!video) {
    return {
      title: "Reel not found | FuntApp",
      description: "This reel may have been removed or is unavailable.",
      robots: { index: false, follow: false },
    };
  }

  const meta = buildVideoShareMeta(video, "reel");

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.pageUrl },
    openGraph: {
      type: "website",
      siteName: "FuntApp",
      title: meta.title,
      description: meta.description,
      url: meta.pageUrl,
      images: meta.imageUrl
        ? [{ url: meta.imageUrl, width: 1200, height: 630, alt: meta.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: meta.imageUrl ? [meta.imageUrl] : [],
    },
    other: {
      "al:android:url": appReelDeepLink(reelId),
      "al:android:package": "com.infayou.funtapp",
      "al:android:app_name": "FuntApp",
      "al:web:url": meta.pageUrl,
    },
  };
}

export default async function ReelPage({ params }: PageProps) {
  const { reelId } = await params;

  if (!isValidVideoId(reelId)) {
    notFound();
  }

  const video = await fetchVideoById(reelId);
  if (!video) {
    notFound();
  }

  const meta = buildVideoShareMeta(video, "reel");

  return (
    <ShareContentPage
      kind="reel"
      id={video.id}
      caption={video.caption}
      imageUrl={video.imageUrl}
      authorName={video.authorName}
      authorUsername={video.authorUsername}
      authorImageUrl={video.authorImageUrl}
      pageUrl={meta.pageUrl}
      deepLink={appReelDeepLink(video.id)}
      title={meta.title}
      description={meta.description}
    />
  );
}
