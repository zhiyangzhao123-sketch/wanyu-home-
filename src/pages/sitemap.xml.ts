import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const SITE = "https://linwanyu.top";

type Entry = { loc: string; lastmod?: Date };

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog")).filter((post) => !post.data.draft);
  const albums = await getCollection("gallery");
  const thoughts = await getCollection("thoughts");

  const latestThought = thoughts
    .map((t) => t.data.pubDate)
    .sort((a, b) => b.valueOf() - a.valueOf())[0];

  const entries: Entry[] = [
    { loc: "/" },
    { loc: "/blog/", lastmod: posts.map((p) => p.data.pubDate).sort((a, b) => b.valueOf() - a.valueOf())[0] },
    { loc: "/thoughts/", lastmod: latestThought },
    // 相册为空时不进 sitemap，也不进导航：不把爬虫引到一个空页面。
    ...(albums.length > 0 ? [{ loc: "/gallery/" }] : []),
    { loc: "/about/" },
    { loc: "/guestbook/" },
    ...posts.map((post) => ({ loc: `/blog/${post.id}/`, lastmod: post.data.pubDate })),
    ...albums.map((album) => ({ loc: `/gallery/${album.id}/`, lastmod: album.data.date })),
  ];

  const urls = entries
    .map(({ loc, lastmod }) =>
      lastmod
        ? `  <url><loc>${SITE}${loc}</loc><lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod></url>`
        : `  <url><loc>${SITE}${loc}</loc></url>`,
    )
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
