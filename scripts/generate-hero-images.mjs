import sharp from "sharp";
import { mkdirSync } from "fs";

const palettes = [
  ["#F8F5EF", "#E7B98A", "#EBC9C4"],
  ["#FFFDF8", "#E7B98A", "#F3EEE6"],
  ["#F3EEE6", "#EBC9C4", "#E7B98A"],
  ["#EBC9C4", "#F8F5EF", "#A9C8A2"],
  ["#E7B98A", "#FFFDF8", "#EBC9C4"],
];

mkdirSync("src/assets/hero", { recursive: true });

for (let i = 0; i < 5; i++) {
  const [c1, c2, c3] = palettes[i];
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'>",
    "<defs>",
    "<radialGradient id='g1' cx='30%' cy='35%' r='70%'>",
    `<stop offset='0%' stop-color='${c1}'/>`,
    `<stop offset='55%' stop-color='${c2}'/>`,
    `<stop offset='100%' stop-color='${c3}'/>`,
    "</radialGradient>",
    "<radialGradient id='g2' cx='75%' cy='65%' r='55%'>",
    `<stop offset='0%' stop-color='${c3}' stop-opacity='0.55'/>`,
    `<stop offset='100%' stop-color='${c2}' stop-opacity='0'/>`,
    "</radialGradient>",
    "</defs>",
    "<rect width='100%' height='100%' fill='url(#g1)'/>",
    "<rect width='100%' height='100%' fill='url(#g2)'/>",
    "</svg>",
  ].join("");

  const filename = `src/assets/hero/hero-0${i + 1}.jpg`;
  await sharp(Buffer.from(svg))
    .resize(1920, 1080)
    .blur(18)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(filename);

  console.log(`Created ${filename}`);
}
