import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Cache } from "./types.js";

const CACHE_PATH = path.join(os.homedir(), ".config", "rssterm", "cache.json");

export function loadCache(): Cache {
  try {
    if (!fs.existsSync(CACHE_PATH)) return {};
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

export function saveCache(cache: Cache): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // best-effort
  }
}
