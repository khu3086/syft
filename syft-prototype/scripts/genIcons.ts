/**
 * Generates Syft's PWA app icons from a single on-brand SVG mark — the serif
 * italic "s" wordmark in cream on the warm terracotta accent (matches §11 design
 * language). Run once via `pnpm icons`; outputs land in public/ and public/icons/.
 *
 * Two glyph treatments:
 *  - "any" / apple-touch: full-bleed, glyph fills more of the tile.
 *  - "maskable": glyph pulled into the inner 80% safe zone so Android/iOS masks
 *    (circle, squircle) never clip it.
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const BG = "#86c1ea"; // light blue icon tile
const FG = "#13223a"; // deep navy glyph (readable on light blue)
const PUBLIC = join(process.cwd(), "public");

/** One square SVG. glyphScale is the font-size as a fraction of the tile. */
function iconSVG(size: number, glyphScale: number): string {
  const fontSize = Math.round(size * glyphScale);
  // Nudge the optical center down slightly — italic serifs sit high otherwise.
  const cy = Math.round(size * 0.52);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <text x="50%" y="${cy}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-style="italic" fill="${FG}" text-anchor="middle" dominant-baseline="central">s</text>
</svg>`;
}

async function png(size: number, glyphScale: number): Promise<Buffer> {
  return sharp(Buffer.from(iconSVG(size, glyphScale))).png().toBuffer();
}

async function main() {
  const targets: Array<{ file: string; size: number; scale: number }> = [
    { file: "icons/icon-192.png", size: 192, scale: 0.62 },
    { file: "icons/icon-512.png", size: 512, scale: 0.62 },
    // Maskable: glyph kept inside the ~80% safe zone.
    { file: "icons/icon-maskable-192.png", size: 192, scale: 0.46 },
    { file: "icons/icon-maskable-512.png", size: 512, scale: 0.46 },
    // iOS home screen (Safari ignores manifest icons).
    { file: "apple-touch-icon.png", size: 180, scale: 0.6 },
    // Favicons.
    { file: "icon-32.png", size: 32, scale: 0.66 },
    { file: "favicon.ico", size: 48, scale: 0.66 },
  ];

  for (const t of targets) {
    const buf =
      t.file === "favicon.ico"
        ? await sharp(Buffer.from(iconSVG(t.size, t.scale)))
            .resize(48, 48)
            .toFormat("png")
            .toBuffer() // .ico container not needed; browsers accept PNG-in-.ico path via link
        : await png(t.size, t.scale);
    await writeFile(join(PUBLIC, t.file), buf);
    console.log("wrote", t.file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
