export type GalleryAlbumEntry = Awaited<
  ReturnType<typeof import("astro:content").getCollection<"gallery">>
>[number];

export function getAlbumSlug(id: string): string {
  return id.replace(/\/index$/, "");
}

export function formatAlbumDateLabel(data: {
  date: Date;
  dateRange?: string;
}): string {
  if (data.dateRange) return data.dateRange;
  return data.date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
  });
}

export function sortGalleryAlbums(albums: GalleryAlbumEntry[]): GalleryAlbumEntry[] {
  return [...albums].sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}
