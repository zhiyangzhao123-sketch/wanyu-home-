import type { ImageMetadata } from "astro";
import cover01 from "../assets/covers/cover-01.jpg";
import cover02 from "../assets/covers/cover-02.jpg";
import cover03 from "../assets/covers/cover-03.jpg";

const COVERS: Record<string, ImageMetadata> = {
  "cover-01": cover01,
  "cover-02": cover02,
  "cover-03": cover03,
};

export function getBlogCover(coverKey?: string): ImageMetadata | undefined {
  if (!coverKey) return undefined;
  return COVERS[coverKey];
}
