import sharp from "sharp";
import { mkdirSync } from "fs";

const palettes = [
  ["#FFFDF8", "#E7B98A", "#EBC9C4"],
  ["#F3EEE6", "#A9C8A2", "#F8F5EF"],
  ["#EBC9C4", "#E7B98A", "#FFFDF8"],
  ["#EFF5E8", "#FDF6DC", "#E7B98A"],
  ["#F8F5EF", "#EBC9C4", "#F3EEE6"],
  ["#E7B98A", "#FFFDF8", "#A9C8A2"],
];

mkdirSync("src/assets/gallery", { recursive: true });

for (let i = 0; i < 6; i++) {
  const [c1, c2, c3] = palettes[i];
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>",
    "<defs>",
    "<radialGradient id='g1' cx='32%' cy='34%' r='68%'>",
    `<stop offset='0%' stop-color='${c1}'/>`,
    `<stop offset='55%' stop-color='${c2}'/>`,
    `<stop offset='100%' stop-color='${c3}'/>`,
    "</radialGradient>",
    "</defs>",
    "<rect width='100%' height='100%' fill='url(#g1)'/>",
    "</svg>",
  ].join("");

  const filename = `src/assets/gallery/g-0${i + 1}.jpg`;
  await sharp(Buffer.from(svg))
    .resize(800, 800)
    .blur(12)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(filename);

  console.log(`Created ${filename}`);
}
