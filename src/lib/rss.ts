import Parser from "rss-parser";
import type { FeedItem } from "./types.js";

type CustomItem = {
  mediaThumbnail?: { $?: { url?: string } };
  itunesImage?: { $?: { href?: string } };
  "media:content"?: { $?: { url?: string; medium?: string } };
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 10000,
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["itunes:image", "itunesImage"],
      ["media:content", "media:content"],
    ],
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImageUrl(item: CustomItem & { enclosure?: { url?: string; type?: string } }): string | undefined {
  if (item.enclosure?.type?.startsWith("image/") && item.enclosure.url) {
    return item.enclosure.url;
  }
  const mediaContent = item["media:content"];
  if (mediaContent?.$?.url) {
    return mediaContent.$.url;
  }
  if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url;
  }
  if (item.itunesImage?.$?.href) {
    return item.itunesImage.$.href;
  }
  return undefined;
}

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(url);
  return feed.items.map((item) => ({
    title: item.title ?? "No title",
    link: item.link ?? "",
    pubDate: item.pubDate ?? item.isoDate ?? null,
    description: stripHtml(
      item.contentSnippet ?? item.content ?? item.summary ?? ""
    ).slice(0, 200),
    source: feed.title ?? url,
    feedUrl: url,
    imageUrl: extractImageUrl(item as CustomItem & { enclosure?: { url?: string; type?: string } }),
  }));
}
