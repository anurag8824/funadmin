"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  PLAY_STORE_URL,
  appPostDeepLink,
} from "@/lib/site";
import type { SharePost } from "@/lib/posts";

type PostSharePageProps = {
  post: SharePost;
  pageUrl: string;
  title: string;
  description: string;
};

export default function PostSharePage({
  post,
  pageUrl,
  title,
  description,
}: PostSharePageProps) {
  const deepLink = appPostDeepLink(post.id);
  const intentUrl = `intent://funtapp.com/post/${post.id}#Intent;scheme=https;package=com.infayou.funtapp;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-purple/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-pink/10 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="FuntApp" fill className="object-cover" />
            </div>
            <span className="font-semibold">
              <span className="text-gradient">Funt</span>App
            </span>
          </Link>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/10 px-4 py-2 text-xs text-[#B3B3B3] transition-colors hover:border-white/20 hover:text-white"
          >
            Get the app
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-[#0D0D0D]"
        >
          {post.imageUrl ? (
            <div className="relative aspect-square w-full bg-[#1a1a1a]">
              <Image
                src={post.imageUrl}
                alt={title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-brand-pink/20 to-brand-purple/20">
              <span className="text-5xl">📷</span>
            </div>
          )}

          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full bg-brand-purple/30">
                {post.authorImageUrl ? (
                  <Image
                    src={post.authorImageUrl}
                    alt={post.authorName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                    {post.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{post.authorName}</p>
                <p className="text-sm text-[#B3B3B3]">@{post.authorUsername}</p>
              </div>
            </div>

            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-[#B3B3B3]">
              {post.caption || description}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mt-8 space-y-4"
        >
          <p className="text-center text-sm text-[#B3B3B3]">
            If FuntApp is installed, this link opens the post in the app
            automatically. Otherwise, view it here and download below.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={pageUrl}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Open in FuntApp
            </a>

            <a
              href={intentUrl}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-[#B3B3B3] transition-colors hover:border-white/20 hover:text-white sm:hidden"
            >
              Open app (Android)
            </a>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.003 1.003 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
              </svg>
              <span className="font-semibold">Get it on Google Play</span>
            </a>
          </div>

          <p className="text-center text-xs text-[#666]">
            Direct link:{" "}
            <a href={deepLink} className="text-brand-purple hover:underline">
              {deepLink}
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
