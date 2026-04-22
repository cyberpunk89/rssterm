import { spawn } from "node:child_process";

export function openInBrowser(url: string): void {
  if (!url) return;
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}
