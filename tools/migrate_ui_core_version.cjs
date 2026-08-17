"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { UIBuilder } = require("../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const projectRoot = path.resolve(__dirname, "..");
const projectCoreVersion = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "Environment", "config"), "utf8"),
).CoreVersion;

for (const input of process.argv.slice(2)) {
  const target = path.resolve(projectRoot, input);
  const builder = UIBuilder.read(target);
  builder._data = builder.build();
  builder._data.CoreVersion = projectCoreVersion;
  builder.write(target, { lint: false, strict: false });
  console.log(`Migrated ${input} to CoreVersion ${projectCoreVersion}`);
}
