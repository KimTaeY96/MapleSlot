import fs from "node:fs";
import path from "node:path";

const endpoint = "https://msw-mcp.nexon.com/mcp";
const token = process.env.MSW_MCP_API_KEY;
if (!token) {
  throw new Error("MSW_MCP_API_KEY is not set");
}

const projectRoot = "C:/Users/ghddj/Desktop/AI/MSW";
const assetDir = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "bonus777", "sliced");
const manifestPath = path.join(projectRoot, "GeneratedAssets", "SlotMachineUI", "msw_resource_manifest.json");
const forceUpload = process.env.MSW_FORCE_BONUS777_SLOT_UPLOAD === "1";

const assets = [
  ["bonus777SlotFrameShellBalanced", "bonus777_slot_frame_shell_balanced.png"],
  ["bonus777SlotReelWindowFrameBalanced", "bonus777_slot_reel_window_frame_balanced.png"],
  ["bonus777SlotReelColumnBackground", "bonus777_slot_reel_column_background.png"],
  ["bonus777SlotDigitCell", "bonus777_slot_digit_cell.png"],
  ["bonus777SlotLeverUp", "bonus777_slot_lever_up.png"],
  ["bonus777SlotLeverMid", "bonus777_slot_lever_mid.png"],
  ["bonus777SlotLeverDown", "bonus777_slot_lever_down.png"],
  ["bonus777SlotLeverBaseCompact", "bonus777_slot_lever_base_compact.png"],
  ["bonus777SlotLeverArmUp", "bonus777_slot_lever_arm_up.png"],
  ["bonus777SlotLeverArmMidVertical", "bonus777_slot_lever_arm_mid_vertical.png"],
  ["bonus777SlotLeverArmDownVertical", "bonus777_slot_lever_arm_down_vertical.png"],
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
    description: `Generated 777 bonus slot UI asset: ${baseName}. Original project asset.`,
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
  clientInfo: { name: "codex-bonus777-slot-upload", version: "0.1.0" },
});
await notifyInitialized();

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};
let uploaded = 0;
let skipped = 0;

for (const [key, fileName] of assets) {
  const fileSize = fs.statSync(path.join(assetDir, fileName)).size;
  if (!forceUpload && manifest[key]?.ruid && manifest[key]?.size === fileSize) {
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
console.log(`Merged 777 bonus slot assets into ${manifestPath}`);
console.log(`Uploaded ${uploaded}, skipped ${skipped}.`);
