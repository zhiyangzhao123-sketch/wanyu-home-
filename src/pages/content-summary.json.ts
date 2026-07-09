import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// `output: 'static'` in astro.config.mjs already prerenders every route by
// default, so this isn't strictly required — but it's set explicitly so
// this endpoint stays a build-time static JSON file even if the project's
// output mode ever changes to 'hybrid' in the future.
export const prerender = true;

const MAX_POSTS = 5;
const MAX_THOUGHTS = 5;
const THOUGHT_EXCERPT_LENGTH = 100;

function truncate(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export const GET: APIRoute = async () => {
  const blogEntries = await getCollection("blog", ({ data }) => !data.draft);
  const posts = blogEntries
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, MAX_POSTS)
    .map((post) => ({
      title: post.data.title,
      description: post.data.description,
      category: post.data.category,
      pubDate: post.data.pubDate.toISOString(),
    }));

  const thoughtEntries = await getCollection("thoughts");
  const thoughts = thoughtEntries
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, MAX_THOUGHTS)
    .map((thought) => ({
      date: thought.data.pubDate.toISOString(),
      // The diary text lives in the markdown body, not frontmatter — same
      // field thoughts.astro already reads (`thought.body`).
      content: truncate(thought.body ?? "", THOUGHT_EXCERPT_LENGTH),
      mood: thought.data.mood ?? null,
      weather: thought.data.weather ?? null,
    }));

  const galleryEntries = await getCollection("gallery");
  const albums = galleryEntries
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((album) => ({
      title: album.data.title,
      description: album.data.description ?? "",
      photoCount: album.data.photos.length,
      photoCaptions: album.data.photos
        .map((photo) => photo.caption?.trim())
        .filter((caption): caption is string => Boolean(caption)),
    }));

  const summary = {
    posts,
    thoughts,
    albums,
    generatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(summary, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
};
