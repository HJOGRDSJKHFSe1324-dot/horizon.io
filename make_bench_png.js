const sharp = require("sharp");

const rows = [
  { name: "Zenith-1.1", score: 8.9, color: "#22d3ee" },
  { name: "Halo-1.5", score: 21.4, color: "#3b82f6" },
  { name: "Halo 2.5", score: 41.1, color: "#8b5cf6" },
  { name: "Nova 5.2", score: 50.0, color: "#f59e0b" },
];

const W = 1000, H = 520, pad = 60, titleH = 70;
let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,system-ui,sans-serif">`;
svg += `<rect width="100%" height="100%" fill="#0b0d12"/>`;
svg += `<text x="${W/2}" y="42" text-anchor="middle" fill="#f5f7fa" font-size="26" font-weight="600">MMLU-Pro Benchmark (56-question sample)</text>`;
svg += `<text x="${W/2}" y="66" text-anchor="middle" fill="#a3a8b9" font-size="13">Accuracy: % correct. Lower-tier sample; measured locally/offline.</text>`;

const chartLeft = 220, chartRight = W - 60, chartTop = 110, chartBottom = H - 60;
const barH = 44, gap = 24;
rows.forEach((r, i) => {
  const y = chartTop + i * (barH + gap);
  const barWidth = ((chartRight - chartLeft) * (r.score / 100));
  svg += `<text x="${chartLeft - 16}" y="${y + barH / 2 + 5}" text-anchor="end" fill="#f5f7fa" font-size="16" font-weight="500">${r.name}</text>`;
  svg += `<rect x="${chartLeft}" y="${y}" width="${chartRight - chartLeft}" height="${barH}" rx="8" fill="#1a1e28" />`;
  svg += `<rect x="${chartLeft}" y="${y}" width="${barWidth}" height="${barH}" rx="8" fill="${r.color}" />`;
  svg += `<text x="${chartLeft + barWidth + 12}" y="${y + barH / 2 + 6}" fill="#f5f7fa" font-size="18" font-weight="600">${r.score.toFixed(1)}%</text>`;
});

// axis line
svg += `<line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="#33394d" stroke-width="1"/>`;
svg += `<text x="${chartLeft}" y="${chartBottom + 20}" fill="#6b7280" font-size="11">0%</text>`;
svg += `<text x="${chartRight}" y="${chartBottom + 20}" text-anchor="end" fill="#6b7280" font-size="11">100%</text>`;
svg += `</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile("C:\\Users\\rogen\\Documents\\Horizon website\\MMLU_PRO_SCORES.png")
  .then(() => console.log("wrote MMLU_PRO_SCORES.png"))
  .catch((e) => console.error(e));