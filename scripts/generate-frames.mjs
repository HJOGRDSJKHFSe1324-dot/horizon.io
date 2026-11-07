import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const FRAME_COUNT = 144;
const RESOLUTIONS = [512, 256];
const PREVIEW_SIZE = 128;
const SOURCE = path.join(root, "public", "brand", "horizon-mark.svg");
const OUT_DIR = path.join(root, "public", "frames");

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

function frameName(index) {
  return `frame_${String(index).padStart(3, "0")}.webp`;
}

async function renderBase(size) {
  // Supersample the SVG so rotating/downscaling stays crisp.
  const density = size * 2;
  return sharp(SOURCE, { density }).png().toBuffer();
}

async function writeFrame(base, size, index, dir) {
  const angle = (index / FRAME_COUNT) * 360;
  await sharp(base)
    .rotate(angle, { background: transparent })
    .resize(size, size, { fit: "contain", background: transparent })
    .webp({ quality: 92, alphaQuality: 100, lossless: false })
    .toFile(path.join(dir, frameName(index)));
}

async function generateResolution(size) {
  const dir = path.join(OUT_DIR, String(size));
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const base = await renderBase(size);
  for (let i = 0; i < FRAME_COUNT; i++) {
    await writeFrame(base, size, i, dir);
    if (i % 24 === 0 || i === FRAME_COUNT - 1) {
      process.stdout.write(`  ${size}px: ${i + 1}/${FRAME_COUNT}\r`);
    }
  }
  process.stdout.write(`  ${size}px: ${FRAME_COUNT}/${FRAME_COUNT}\n`);
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Generating ${FRAME_COUNT} transparent WebP frames from ${SOURCE}`);
  for (const size of RESOLUTIONS) {
    await generateResolution(size);
  }

  // Low-resolution poster frame for previews / first paint.
  const previewBase = await renderBase(PREVIEW_SIZE);
  await sharp(previewBase)
    .rotate(0, { background: transparent })
    .resize(PREVIEW_SIZE, PREVIEW_SIZE, { fit: "contain", background: transparent })
    .webp({ quality: 80, alphaQuality: 100 })
    .toFile(path.join(OUT_DIR, "preview.webp"));

  const manifest = {
    name: "horizon-mark-spin",
    version: 1,
    source: "public/brand/horizon-mark.svg",
    frameCount: FRAME_COUNT,
    angleStepDegrees: 360 / FRAME_COUNT,
    transparent: true,
    background: "transparent",
    format: "webp",
    fps: 30,
    durationSeconds: (FRAME_COUNT / 30),
    loop: true,
    resolutions: RESOLUTIONS.map((size) => ({
      size,
      width: size,
      height: size,
      directory: String(size),
      count: FRAME_COUNT,
      filePattern: "frame_{index}.webp",
      zeroPadding: 3,
    })),
    preview: {
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      file: "preview.webp",
    },
  };

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );

  console.log(`Done. Output: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
