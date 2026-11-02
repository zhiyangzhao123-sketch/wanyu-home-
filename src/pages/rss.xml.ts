import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const SITE = "https://linwanyu.top";
const TITLE = "宛瑜的小窝";
const DESC = "记录一点生活，分享一点温柔。";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 30);

  const items = posts
    .map((post) => {
      const url = `${SITE}/blog/${post.id}/`;
      return `    <item>
      <title>${esc(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(post.data.description)}</description>
      <category>${esc(post.data.category)}</category>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const lastBuild = (posts[0]?.data.pubDate ?? new Date()).toUTCString();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${TITLE}</title>
    <link>${SITE}/</link>
    <description>${DESC}</description>
    <language>zh-TW</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
