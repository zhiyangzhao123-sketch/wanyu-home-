import sharp from "sharp";
import { mkdirSync } from "fs";

const covers = [
  { file: "cover-01.jpg", colors: ["#FFFDF8", "#E7B98A", "#EBC9C4"] },
  { file: "cover-02.jpg", colors: ["#F3EEE6", "#E7B98A", "#F8F5EF"] },
  { file: "cover-03.jpg", colors: ["#EBC9C4", "#A9C8A2", "#FDF6DC"] },
];

mkdirSync("src/assets/covers", { recursive: true });

for (const { file, colors: [c1, c2, c3] } of covers) {
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000'>",
    "<defs>",
    "<radialGradient id='g1' cx='28%' cy='38%' r='72%'>",
    `<stop offset='0%' stop-color='${c1}'/>`,
    `<stop offset='55%' stop-color='${c2}'/>`,
    `<stop offset='100%' stop-color='${c3}'/>`,
    "</radialGradient>",
    "<radialGradient id='g2' cx='78%' cy='62%' r='50%'>",
    `<stop offset='0%' stop-color='${c3}' stop-opacity='0.5'/>`,
    `<stop offset='100%' stop-color='${c2}' stop-opacity='0'/>`,
    "</radialGradient>",
    "</defs>",
    "<rect width='100%' height='100%' fill='url(#g1)'/>",
    "<rect width='100%' height='100%' fill='url(#g2)'/>",
    "</svg>",
  ].join("");

  const filename = `src/assets/covers/${file}`;
  await sharp(Buffer.from(svg))
    .resize(1600, 1000)
    .blur(16)
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(filename);

  console.log(`Created ${filename}`);
}
