import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";


const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const assetDir = path.join(projectRoot, "GeneratedAssets", "CoinAnimation", "frames");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "CoinAnimation", "msw_resource_manifest.json");
const endpoint = "https://msw-mcp.nexon.com/mcp";
const token = process.env.MSW_MCP_API_KEY;
const assets = Array.from({ length: 4 }, (_, index) => {
  const frameNumber = index + 1;
  return [
    `mileageCoinSpinFrame${String(frameNumber).padStart(2, "0")}`,
    `mileage_coin_spin_frame_${String(frameNumber).padStart(2, "0")}.png`,
  ];
});

if (!token) throw new Error("MSW_MCP_API_KEY is not set");

let nextId = 1;
let sessionId = null;

function parseMcpResponse(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.includes("data:")) {
    const dataLine = trimmed
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    return JSON.parse(dataLine);
  }
  return JSON.parse(trimmed);
}

async function mcp(method, params) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  const newSessionId = response.headers.get("mcp-session-id");
  if (newSessionId) sessionId = newSessionId;
  const text = await response.text();
  if (!response.ok) throw new Error(`MCP ${method} failed: ${response.status} ${text}`);
  const json = parseMcpResponse(text);
  if (json?.error) throw new Error(`MCP ${method} error: ${JSON.stringify(json.error)}`);
  return json?.result;
}

async function notifyInitialized() {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
  });
}

function parseToolText(result) {
  const text = result?.content?.find((entry) => entry.type === "text")?.text;
  if (!text) throw new Error(`Missing tool text: ${JSON.stringify(result)}`);
  return JSON.parse(text);
}

async function callTool(name, args) {
  return parseToolText(await mcp("tools/call", { name, arguments: args }));
}

async function uploadFrame(key, fileName, frameIndex) {
  const filePath = path.join(assetDir, fileName);
  const bytes = fs.readFileSync(filePath);
  const commonArgs = {
    category: "sprite",
    subcategory: "item",
    name: key,
    description:
      `Frame ${frameIndex + 1}/4 for the 150ms pixel-art mileage coin rotation based on e9c1cc8acd504e41b1cdd4492c2fc05b.`,
    contentLength: bytes.length,
  };

  const signed = await callTool("asset_create_account_resource_storage_item", commonArgs);
  if (!signed.presignedUrl) throw new Error(`No presignedUrl for ${fileName}`);
  const put = await fetch(signed.presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(bytes.length),
      "Content-Type": "image/png",
    },
    body: bytes,
  });
  if (!put.ok) throw new Error(`PUT failed for ${fileName}: ${put.status} ${await put.text()}`);

  const completed = await callTool("asset_create_account_resource_storage_item", {
    ...commonArgs,
    fileUrl: signed.presignedUrl,
  });
  const ruid = completed?.result?.ugcInfo?.ruid;
  if (!ruid) throw new Error(`No RUID for ${fileName}: ${JSON.stringify(completed)}`);
  return { key, fileName, ruid, size: bytes.length };
}

await mcp("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "codex-mileage-coin-spin-frame-upload", version: "0.1.0" },
});
await notifyInitialized();

const previousManifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};
const manifest = {
  sourceRuid: "e9c1cc8acd504e41b1cdd4492c2fc05b",
  referenceAnimationRuid: "b60c3cbbf52c40709f2fd886d98fe2d9",
  frameCount: 4,
  frameDurationMs: 150,
  animationClipRuid: previousManifest.animationClipRuid ?? "",
  animationClipName: previousManifest.animationClipName ?? "mileage_coin_spin_4f_pixel",
  frames: {},
};

for (let index = 0; index < assets.length; index += 1) {
  const [key, fileName] = assets[index];
  console.log(`Uploading ${fileName}...`);
  manifest.frames[key] = await uploadFrame(key, fileName, index);
  console.log(`  ${key}: ${manifest.frames[key].ruid}`);
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${manifestPath}`);
