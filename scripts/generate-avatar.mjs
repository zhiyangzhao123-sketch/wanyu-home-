import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("src/assets", { recursive: true });

const svg = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>",
  "<circle cx='256' cy='256' r='250' fill='#F3EEE6'/>",
  "<circle cx='256' cy='218' r='88' fill='#E7B98A' opacity='0.85'/>",
  "<ellipse cx='256' cy='372' rx='112' ry='86' fill='#EBC9C4' opacity='0.7'/>",
  "<circle cx='218' cy='206' r='12' fill='#5B5148'/>",
  "<circle cx='294' cy='206' r='12' fill='#5B5148'/>",
  "<path d='M218 262c28 28 108 28 136 0' stroke='#5B5148' stroke-width='10' stroke-linecap='round' fill='none'/>",
  "</svg>",
].join("");

const filename = "src/assets/avatar.png";
await sharp(Buffer.from(svg)).resize(512, 512).png({ quality: 90 }).toFile(filename);

console.log(`Created ${filename}`);
