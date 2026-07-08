import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(["日常", "学习日记"]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    pinned: z.boolean().optional().default(false),
  }),
});

const thoughts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/thoughts" }),
  schema: z.object({
    pubDate: z.coerce.date(),
    mood: z.string().optional(),
    weather: z.string().optional(),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/index.{md,mdx}", base: "./src/content/gallery" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      dateRange: z.string().optional(),
      description: z.string().optional(),
      cover: image(),
      photos: z.array(
        z.object({
          src: image(),
          caption: z.string().optional(),
          date: z.string().optional(),
        }),
      ),
    }),
});

export const collections = { blog, thoughts, gallery };
