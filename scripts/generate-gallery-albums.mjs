import sharp from "sharp";
import { mkdirSync, copyFileSync } from "fs";
import { join } from "path";

const albums = {
  "daily-fragments": ["g-01", "g-02", "g-03", "g-04", "g-05"],
  "little-trip": ["g-02", "g-03", "g-04", "g-05", "g-06"],
};

for (const [slug, sources] of Object.entries(albums)) {
  const dir = join("src/assets/gallery", slug);
  mkdirSync(dir, { recursive: true });

  sources.forEach((source, index) => {
    const from = join("src/assets/gallery", `${source}.jpg`);
    const to = join(dir, `${String(index + 1).padStart(2, "0")}.jpg`);
    copyFileSync(from, to);
  });

  copyFileSync(
    join(dir, "01.jpg"),
    join(dir, "cover.jpg"),
  );

  console.log(`Prepared album assets: ${dir}`);
}
