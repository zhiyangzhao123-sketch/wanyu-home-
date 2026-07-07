export function getReadingMinutes(body: string): number {
  const chars = body.replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(chars / 400));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("zh-TW", {
    month: "numeric",
    day: "numeric",
  });
}

export type BlogCategory = "日常" | "学习日记";

export function getCategoryTint(category: BlogCategory | string): string {
  switch (category) {
    case "日常":
      return "cat-life";
    case "学习日记":
      return "cat-study";
    default:
      return "cat-work";
  }
}
