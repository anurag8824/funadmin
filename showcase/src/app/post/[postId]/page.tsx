import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostSharePage from "@/components/PostSharePage";
import {
  buildPostShareMeta,
  fetchPostById,
  isValidPostId,
} from "@/lib/posts";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;

  if (!isValidPostId(postId)) {
    return {
      title: "Post not found | FuntApp",
      robots: { index: false, follow: false },
    };
  }

  const post = await fetchPostById(postId);
  if (!post) {
    return {
      title: "Post not found | FuntApp",
      description: "This post may have been removed or is unavailable.",
      robots: { index: false, follow: false },
    };
  }

  const meta = buildPostShareMeta(post);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.pageUrl,
    },
    openGraph: {
      type: "website",
      siteName: "FuntApp",
      title: meta.title,
      description: meta.description,
      url: meta.pageUrl,
      images: meta.imageUrl
        ? [
            {
              url: meta.imageUrl,
              width: 1200,
              height: 630,
              alt: meta.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: meta.imageUrl ? [meta.imageUrl] : [],
    },
    other: {
      "al:android:url": `funtap://post/${postId}`,
      "al:android:package": "com.infayou.funtapp",
      "al:android:app_name": "FuntApp",
      "al:web:url": meta.pageUrl,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { postId } = await params;

  if (!isValidPostId(postId)) {
    notFound();
  }

  const post = await fetchPostById(postId);
  if (!post) {
    notFound();
  }

  const meta = buildPostShareMeta(post);

  return (
    <PostSharePage
      post={post}
      pageUrl={meta.pageUrl}
      title={meta.title}
      description={meta.description}
    />
  );
}
