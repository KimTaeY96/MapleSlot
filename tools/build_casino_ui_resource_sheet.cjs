"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const https = require("node:https");
const { PNG } = require("pngjs");

const outDir = "C:/Users/ghddj/Documents/MSW/resource_candidates_casino_ui";

const candidates = [
  ["casino-01", "942681394f444384b38bcf5300dbe2fa"],
  ["casino-02", "d4ee79dd406e4f1694e5c7004c595c8c"],
  ["casino-03", "bd4f38f633aa4cf1b709161202e60257"],
  ["casino-04", "6a30cd67a5d14778b82eef7990102116"],
  ["casino-05", "2a545e3e53e7424591a58b655be2dace"],
  ["casino-06", "f9a136660d854943835f1e5ea2485456"],
  ["casino-07", "bf9335de35cd4e378bc6fea7047ddfcb"],
  ["casino-08", "9e6719c58320416f86c54a84811078da"],

  ["gold-01", "6f69450690eb431ea50b13e0ab51915d"],
  ["gold-02", "f5405a9360d343cfa7bb773078b7dff0"],
  ["gold-03", "3a6f6d8aa4574d3c99bc03186bc71296"],
  ["gold-04", "f4e256fb3bf7415c808400cd60f0faa6"],
  ["gold-05", "332e67d2527d42d18fae9e446a6facb1"],
  ["gold-06", "435c6580a31a4a45ad376b8946e32496"],
  ["gold-07", "f533519bb9704ed586ab20d5f9e08d60"],
  ["gold-08", "27edefe9ad7b4457964d6953fe7f1890"],

  ["button-01", "c70d7dce0ab54f5bbf5d16feb6d69194"],
  ["button-02", "83d578381c3847e1bfc6ee4b859eb6d5"],
  ["button-03", "1df420b15f69434c8f7347bda0ec8785"],
  ["button-04", "f3d4c137e88048eda575bec7f1123dc5"],
  ["button-05", "edd14875a8b348bdbb4f6379880ca3fd"],
  ["button-06", "6dc2b537ab744c43a1347f7798fa91d5"],
  ["button-07", "aba40e37f56f4007b16535f2fd7c2af1"],
  ["button-08", "b02e99c137134a77abef3e706097a009"],

  ["shine-01", "fff6e2dcf8f84bd0b0e7a787081c6d86"],
  ["shine-02", "ffc267067be247a498c17788c67b239f"],
  ["shine-03", "ffb6475308334fb5af7748a2e056c326"],
  ["shine-04", "ff7b3a99e98e4ec59bb6177f40c065fe"],
  ["shine-05", "ff72887182214d3d87d67bccd970f569"],
  ["shine-06", "ff71dfc4352546b0b2baa8727bc4cafa"],
  ["shine-07", "ff5d619815064b8cb647384894f5e44e"],
  ["shine-08", "ff59235d4b3f4ba9b6c791b78e5ae24a"],
];

function thumbUrl(ruid) {
  return `https://mod-thumbnail.dn.nexoncdn.co.kr/${ruid.slice(0, 2)}/${ruid.slice(2, 4)}/${ruid}_64.png`;
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`${url} -> ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

function fillRect(png, x, y, width, height, rgba) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      const idx = (png.width * yy + xx) << 2;
      png.data[idx] = rgba[0];
      png.data[idx + 1] = rgba[1];
      png.data[idx + 2] = rgba[2];
      png.data[idx + 3] = rgba[3];
    }
  }
}

function blit(src, dst, x, y) {
  const left = x + Math.floor((96 - src.width) / 2);
  const top = y + Math.floor((96 - src.height) / 2);
  for (let sy = 0; sy < src.height; sy += 1) {
    for (let sx = 0; sx < src.width; sx += 1) {
      const dx = left + sx;
      const dy = top + sy;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const sidx = (src.width * sy + sx) << 2;
      const didx = (dst.width * dy + dx) << 2;
      const alpha = src.data[sidx + 3] / 255;
      dst.data[didx] = Math.round(src.data[sidx] * alpha + dst.data[didx] * (1 - alpha));
      dst.data[didx + 1] = Math.round(src.data[sidx + 1] * alpha + dst.data[didx + 1] * (1 - alpha));
      dst.data[didx + 2] = Math.round(src.data[sidx + 2] * alpha + dst.data[didx + 2] * (1 - alpha));
      dst.data[didx + 3] = 255;
    }
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const cellW = 180;
  const cellH = 116;
  const cols = 4;
  const rows = Math.ceil(candidates.length / cols);
  const sheet = new PNG({ width: cols * cellW, height: rows * cellH });
  fillRect(sheet, 0, 0, sheet.width, sheet.height, [20, 24, 36, 255]);
  const manifest = [];

  for (let i = 0; i < candidates.length; i += 1) {
    const [label, ruid] = candidates[i];
    const x = (i % cols) * cellW;
    const y = Math.floor(i / cols) * cellH;
    fillRect(sheet, x + 8, y + 8, cellW - 16, cellH - 16, [245, 247, 252, 255]);
    fillRect(sheet, x + 12, y + 12, cellW - 24, cellH - 24, [42, 48, 68, 255]);
    let buffer = null;
    try {
      buffer = await fetchBuffer(thumbUrl(ruid));
    } catch (error) {
      manifest.push({
        index: i + 1,
        grid: `row ${Math.floor(i / cols) + 1}, col ${(i % cols) + 1}`,
        label,
        ruid,
        thumbnail: thumbUrl(ruid),
        unavailable: true,
      });
      continue;
    }
    const pngPath = path.join(outDir, `${label}_${ruid}.png`);
    await fs.writeFile(pngPath, buffer);
    const png = PNG.sync.read(buffer);
    blit(png, sheet, x + 42, y + 10);
    manifest.push({
      index: i + 1,
      grid: `row ${Math.floor(i / cols) + 1}, col ${(i % cols) + 1}`,
      label,
      ruid,
      thumbnail: thumbUrl(ruid),
    });
  }

  const sheetPath = path.join(outDir, "casino_ui_resource_candidates_sheet.png");
  await fs.writeFile(sheetPath, PNG.sync.write(sheet));
  await fs.writeFile(path.join(outDir, "candidates.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(sheetPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
