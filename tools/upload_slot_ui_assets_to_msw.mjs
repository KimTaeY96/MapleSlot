import fs from "node:fs";
import path from "node:path";

const endpoint = "https://msw-mcp.nexon.com/mcp";
const token = process.env.MSW_MCP_API_KEY;
if (!token) {
  throw new Error("MSW_MCP_API_KEY is not set");
}

const assetDir = "C:/Users/ghddj/Desktop/AI/MSW/GeneratedAssets/SlotMachineUI/sliced";
const manifestPath = "C:/Users/ghddj/Desktop/AI/MSW/GeneratedAssets/SlotMachineUI/msw_resource_manifest.json";

const assets = [
  ["mainPanel", "casino_slot_ui_main_panel.png"],
  ["reelFrame", "casino_slot_ui_reel_frame.png"],
  ["hudPanel", "casino_slot_ui_hud_panel.png"],
  ["currencyBar", "casino_slot_ui_currency_bar.png"],
  ["dropdown", "casino_slot_ui_dropdown.png"],
  ["dropdownList", "casino_slot_ui_dropdown_list.png"],
  ["cellBlue", "casino_slot_ui_cell_blue.png"],
  ["cellGold", "casino_slot_ui_cell_gold.png"],
  ["buttonBlue", "casino_slot_ui_button_blue.png"],
  ["buttonBlueSelected", "casino_slot_ui_button_blue_selected.png"],
  ["buttonBlueDisabled", "casino_slot_ui_button_blue_disabled.png"],
  ["buttonGreen", "casino_slot_ui_button_green.png"],
  ["winGlow", "casino_slot_ui_win_glow.png"],
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
    description: `Textless generated casino-style slot UI asset: ${baseName}. Original project asset.`,
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
  clientInfo: { name: "codex-slot-ui-upload", version: "0.1.0" },
});
await notifyInitialized();

const uploaded = {};
for (const [key, fileName] of assets) {
  console.log(`Uploading ${fileName}...`);
  uploaded[key] = await uploadOne(key, fileName);
  console.log(`  ${key}: ${uploaded[key].ruid}`);
}

fs.writeFileSync(manifestPath, JSON.stringify(uploaded, null, 2), "utf8");
console.log(`Wrote ${manifestPath}`);
