export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string;
  source: string;
  feedUrl: string;
  imageUrl?: string;
  hasError?: boolean;
}

export interface CacheEntry {
  feedUrl: string;
  fetchedAt: string;
  items: FeedItem[];
}

export interface Cache {
  [feedUrl: string]: CacheEntry;
}

export interface FeedConfig {
  name: string;
  url: string;
}

export interface CategoryConfig {
  name: string;
  icon: string;
  feeds: FeedConfig[];
}

export interface AppConfig {
  refreshOnStart: boolean;
  categories: CategoryConfig[];
}
