const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../assets/images");

function walk(dir, rel = "") {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out = out.concat(walk(p, r));
    else if (/\.(png|jpg|jpeg|webp|gif)$/i.test(ent.name)) {
      // Metro + @/ alias: filenames like react-logo@2x.png break resolution (second @ confuses the bundler).
      if (!ent.name.includes("@")) out.push(r.replace(/\\/g, "/"));
    }
  }
  return out;
}

const files = walk(root).sort();
const lines = files.map(
  (f) => `  "${f}": require("@/assets/images/${f}"),`
);
const out = `/* eslint-disable @typescript-eslint/no-require-imports */
import type { ImageSourcePropType } from "react-native";

export const IMAGE_MAP: Record<string, ImageSourcePropType> = {
${lines.join("\n")}
};

export function getImageSource(key: string): ImageSourcePropType {
  const src = IMAGE_MAP[key];
  if (!src) throw new Error(\`Missing image: \${key}\`);
  return src;
}
`;

fs.writeFileSync(path.join(__dirname, "../constants/imageMap.ts"), out);
console.log("Wrote", files.length, "image keys");
