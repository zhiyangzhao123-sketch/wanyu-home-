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

export function sortBlogPosts<T extends { data: { pinned?: boolean; pubDate: Date } }>(
  posts: T[],
): T[] {
  return [...posts].sort((a, b) => {
    if (!!a.data.pinned !== !!b.data.pinned) {
      return a.data.pinned ? -1 : 1;
    }
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}

export function formatMonthGroup(date: Date): string {
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });
}

export function formatMonthAnchorId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `month-${year}-${month}`;
}

export function formatMonthAnchorLabel(date: Date): string {
  const month = date.getMonth() + 1;
  if (month === 1) {
    return `${date.getFullYear()}年1月`;
  }
  return `${month}月`;
}

const WEATHER_EMOJI: Record<string, string> = {
  晴: "☀",
  雨: "🌧",
  多云: "⛅",
  阴: "☁",
  雪: "❄",
};

export function getWeatherEmoji(weather?: string): string {
  if (!weather) return "";
  return WEATHER_EMOJI[weather] ?? weather;
}

export function formatThoughtMeta(date: Date, mood?: string, weather?: string): string {
  const parts = [formatShortDate(date)];
  const weatherEmoji = getWeatherEmoji(weather);
  if (weatherEmoji) parts.push(weatherEmoji);
  if (mood) parts.push(mood);
  return parts.join(" · ");
}
