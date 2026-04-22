import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as yaml from "js-yaml";
import type { AppConfig } from "./types.js";

const CONFIG_PATH = path.join(os.homedir(), ".config", "rssterm", "config.yaml");

export function saveConfig(config: AppConfig): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, yaml.dump(config, { lineWidth: -1 }), "utf-8");
}

export function loadConfig(): AppConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`\nNo config found at: ${CONFIG_PATH}`);
    console.error(`Copy config.example.yaml to that path to get started.\n`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const parsed = yaml.load(raw) as AppConfig;

  if (!parsed.categories || !Array.isArray(parsed.categories)) {
    console.error("Invalid config: missing `categories` array.");
    process.exit(1);
  }

  return {
    refreshOnStart: parsed.refreshOnStart ?? true,
    categories: parsed.categories,
  };
}
