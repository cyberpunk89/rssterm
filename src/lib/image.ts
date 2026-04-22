import terminalImage from "terminal-image";

export async function fetchImageAsLines(
  url: string,
  width: number,
  height: number
): Promise<string[]> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "rssterm/1.0" },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  const rendered = await terminalImage.buffer(buf, {
    width,
    height,
    preserveAspectRatio: true,
    // Force ANSI half-block art — safe for Ink's layout engine
    preferNativeRender: false,
  });

  return rendered.split("\n").filter(Boolean);
}

export function youtubeUrlToRss(input: string): string | null {
  const s = input.trim();
  if (s.includes("feeds/videos.xml")) return s;

  const channelId = s.match(/youtube\.com\/channel\/(UC[\w-]+)/)?.[1];
  if (channelId) return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  const handle = s.match(/youtube\.com\/@([\w.-]+)/)?.[1];
  if (handle) return `https://www.youtube.com/feeds/videos.xml?channel_id=@${handle}`;

  const cname = s.match(/youtube\.com\/(?:c|user)\/([\w-]+)/)?.[1];
  if (cname) return `https://www.youtube.com/feeds/videos.xml?user=${cname}`;

  return null;
}

export function isYoutubeUrl(s: string): boolean {
  return /youtube\.com|youtu\.be/.test(s);
}
