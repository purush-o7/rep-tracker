"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Lightweight YouTube player. Shows the thumbnail until tapped, then swaps in
 * the iframe (with autoplay) — keeps the page fast and avoids loading the
 * player until the user actually wants to watch.
 */
export function YouTubeEmbed({
  url,
  title,
}: {
  url: string | null;
  title?: string;
}) {
  const id = youtubeId(url);
  const [playing, setPlaying] = useState(false);

  if (!id) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title={title ?? "Exercise video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label="Play exercise video"
        >
          <Image
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt={title ?? "Exercise video"}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 40rem"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
