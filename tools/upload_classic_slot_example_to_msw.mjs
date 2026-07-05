import fs from "node:fs";
import path from "node:path";

const endpoint = "https://msw-mcp.nexon.com/mcp";
const token = process.env.MSW_MCP_API_KEY;
if (!token) {
  throw new Error("MSW_MCP_API_KEY is not set");
}

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const assetDir = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "classic_example", "sliced");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const forceUpload = process.env.MSW_FORCE_CLASSIC_SLOT_UPLOAD === "1";

const assets = [
  ["classicSlotFullComposite", "classic_slot_full_composite.png"],
  ["classicSlotFrameShell", "classic_slot_frame_shell.png"],
  ["classicSlotReelWindowFrame", "classic_slot_reel_window_frame.png"],
  ["classicSlotReelStrip1", "classic_slot_reel_strip_1.png"],
  ["classicSlotReelStrip2", "classic_slot_reel_strip_2.png"],
  ["classicSlotReelStrip3", "classic_slot_reel_strip_3.png"],
  ["classicSlotTopArch", "classic_slot_top_arch.png"],
  ["classicSlotTopEmblem", "classic_slot_top_emblem.png"],
  ["classicSlotBottomPanel", "classic_slot_bottom_panel.png"],
  ["classicSlotBasePlinth", "classic_slot_base_plinth.png"],
  ["classicSlotLever", "classic_slot_lever.png"],
  ["classicSlotSideLeft", "classic_slot_side_left.png"],
  ["classicSlotSideRight", "classic_slot_side_right.png"],
  ["classicSlotSymbol7", "classic_slot_symbol_7.png"],
];

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
  if (!response.ok) {
    throw new Error(`MCP ${method} failed: ${response.status} ${text}`);
  }
  const json = parseMcpResponse(text);
  if (json?.error) {
    throw new Error(`MCP ${method} error: ${JSON.stringify(json.error)}`);
  }
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
  if (!text) {
    throw new Error(`Missing tool text: ${JSON.stringify(result)}`);
  }
  return JSON.parse(text);
}

async function callTool(name, args) {
  return parseToolText(await mcp("tools/call", { name, arguments: args }));
}

async function uploadOne(key, fileName) {
  const filePath = path.join(assetDir, fileName);
  const bytes = fs.readFileSync(filePath);
  const baseName = fileName.replace(/\.png$/i, "");
  const commonArgs = {
    category: "sprite",
    subcategory: "object",
    name: baseName,
    description: `Generated classic slot machine UI example asset: ${baseName}. Original project asset.`,
    contentLength: bytes.length,
  };

  const signed = await callTool("asset_create_account_resource_storage_item", commonArgs);
  const presignedUrl = signed.presignedUrl;
  if (!presignedUrl) throw new Error(`No presignedUrl for ${fileName}`);

  const put = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Length": String(bytes.length) },
    body: bytes,
  });
  if (!put.ok) {
    throw new Error(`PUT failed for ${fileName}: ${put.status} ${await put.text()}`);
  }

  const completed = await callTool("asset_create_account_resource_storage_item", {
    ...commonArgs,
    fileUrl: presignedUrl,
  });
  const ruid = completed?.result?.ugcInfo?.ruid;
  if (!ruid) throw new Error(`No ruid for ${fileName}: ${JSON.stringify(completed)}`);
  return { key, fileName, ruid, size: bytes.length };
}

await mcp("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "codex-classic-slot-example-upload", version: "0.1.0" },
});
await notifyInitialized();

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};
let uploaded = 0;
let skipped = 0;

for (const [key, fileName] of assets) {
  if (!forceUpload && manifest[key]?.ruid) {
    console.log(`Skipping ${fileName}: ${manifest[key].ruid}`);
    skipped += 1;
    continue;
  }
  console.log(`Uploading ${fileName}...`);
  manifest[key] = await uploadOne(key, fileName);
  uploaded += 1;
  console.log(`  ${key}: ${manifest[key].ruid}`);
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Merged classic slot assets into ${manifestPath}`);
console.log(`Uploaded ${uploaded}, skipped ${skipped}.`);
