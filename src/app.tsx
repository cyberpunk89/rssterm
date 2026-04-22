import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { ThemeProvider } from "@/components/ui/theme-provider.js";
import { Tabs } from "@/components/ui/tabs.js";
import { UsageMonitor } from "@/components/ui/usage-monitor.js";
import { catppuccinTheme } from "@/lib/terminal-themes/catppuccin.js";
import { ArticleList } from "./components/ArticleList.js";
import { PreviewPane } from "./components/PreviewPane.js";
import { SearchBar } from "./components/SearchBar.js";
import { HelpOverlay } from "./components/HelpOverlay.js";
import { ConfigPanel } from "./components/ConfigPanel.js";
import { loadConfig, saveConfig } from "./lib/config.js";
import { loadCache, saveCache } from "./lib/cache.js";
import { fetchFeed } from "./lib/rss.js";
import { openInBrowser } from "./lib/open.js";
import type { AppConfig, FeedItem, Cache } from "./lib/types.js";

type Mode = "normal" | "search" | "help" | "config";

// Tab 0 is always the synthetic "Home" tab; real category tabs start at index 1.
const HOME_IDX = 0;

const initialCache: Cache = loadCache();

function buildCatItems(cache: Cache, config: AppConfig, catIdx: number): FeedItem[] {
  const cat = config.categories[catIdx];
  if (!cat) return [];
  const items: FeedItem[] = [];
  for (const feed of cat.feeds) {
    const entry = cache[feed.url];
    if (entry) items.push(...entry.items);
  }
  return sortByDate(items);
}

function sortByDate(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0;
    if (!a.pubDate) return 1;
    if (!b.pubDate) return -1;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });
}

export const App = () => {
  const { exit } = useApp();
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [cache, setCache] = useState<Cache>(initialCache);
  // activeTabIdx: 0 = Home, 1..N = categories[0..N-1]
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("normal");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTabs, setLoadingTabs] = useState<Set<number>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [seenLinks] = useState<Set<string>>(new Set());

  const cacheRef = useRef(cache);
  cacheRef.current = cache;
  const configRef = useRef(config);
  configRef.current = config;

  // total tabs = 1 (Home) + categories.length
  const totalTabs = 1 + config.categories.length;

  // per-category items (index 0 = categories[0])
  const allCatItems = useMemo(
    () => config.categories.map((_, i) => buildCatItems(cache, config, i)),
    [cache, config]
  );

  // Home = all items merged, deduplicated by link, sorted by date
  const homeItems = useMemo(() => {
    const seen = new Set<string>();
    const all: FeedItem[] = [];
    for (const items of allCatItems) {
      for (const item of items) {
        if (!seen.has(item.link)) { seen.add(item.link); all.push(item); }
      }
    }
    return sortByDate(all);
  }, [allCatItems]);

  // active tab's raw items
  const rawItems = activeTabIdx === HOME_IDX
    ? homeItems
    : allCatItems[activeTabIdx - 1] ?? [];

  const filteredItems = useMemo(
    () => searchQuery.trim()
      ? rawItems.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.source.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : rawItems,
    [rawItems, searchQuery]
  );

  const selectedItem = filteredItems[focusedIdx] ?? null;

  const unreadCounts = [homeItems, ...allCatItems].map((items) => {
    let n = 0;
    for (const item of items) { if (!seenLinks.has(item.link)) n++; }
    return n;
  });

  useEffect(() => {
    for (const item of filteredItems) seenLinks.add(item.link);
  }, [filteredItems]);

  useEffect(() => {
    setFocusedIdx(0);
    setSearchQuery("");
    if (mode === "search") setMode("normal");
  }, [activeTabIdx]);

  const flashStatus = useCallback((msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 4000);
  }, []);

  // refreshTab(i) refreshes categories[i] (NOT the home tab)
  const refreshTab = useCallback(
    async (catIdx: number) => {
      const cat = configRef.current.categories[catIdx];
      if (!cat) return;
      setLoadingTabs((s) => new Set(s).add(catIdx + 1)); // +1 because Home is tab 0
      const newCache = { ...cacheRef.current };
      await Promise.all(
        cat.feeds.map(async (feed) => {
          try {
            const items = await fetchFeed(feed.url);
            newCache[feed.url] = { feedUrl: feed.url, fetchedAt: new Date().toISOString(), items };
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            flashStatus(`[ERR] ${feed.name}: ${msg.slice(0, 60)}`);
            const existing = cacheRef.current[feed.url];
            if (existing) {
              newCache[feed.url] = {
                ...existing,
                items: existing.items.map((item) => ({ ...item, hasError: true })),
              };
            }
          }
        })
      );
      setCache(newCache);
      saveCache(newCache);
      setLastRefresh(new Date());
      setLoadingTabs((s) => { const next = new Set(s); next.delete(catIdx + 1); return next; });
    },
    [flashStatus]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(configRef.current.categories.map((_, i) => refreshTab(i)));
  }, [refreshTab]);

  useEffect(() => {
    if (config.refreshOnStart) void refreshAll();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (mode === "search") { setMode("normal"); setSearchQuery(""); setFocusedIdx(0); }
      else if (mode === "help" || mode === "config") setMode("normal");
      return;
    }

    if (mode === "search") return;
    if (mode === "help") { if (input === "?") setMode("normal"); return; }
    if (mode === "config") return;

    if (input === "q") { exit(); return; }
    if (input === "?") { setMode("help"); return; }
    if (input === "/") { setMode("search"); return; }
    if (input === "c") { setMode("config"); return; }

    // r refreshes current category (skip Home tab — refresh all for Home)
    if (input === "r") {
      if (activeTabIdx === HOME_IDX) void refreshAll();
      else void refreshTab(activeTabIdx - 1);
      return;
    }
    if (input === "R") { void refreshAll(); return; }

    if (input === "o" || key.return) {
      if (selectedItem?.link) openInBrowser(selectedItem.link);
      return;
    }

    if (input === "j" || key.downArrow) {
      setFocusedIdx((i) => Math.min(filteredItems.length - 1, i + 1));
      return;
    }
    if (input === "k" || key.upArrow) {
      setFocusedIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (input === "h") {
      setActiveTabIdx((i) => (i - 1 + totalTabs) % totalTabs);
      return;
    }
    if (input === "l") {
      setActiveTabIdx((i) => (i + 1) % totalTabs);
      return;
    }
  });

  const handleConfigSave = useCallback((updated: AppConfig) => {
    setConfig(updated);
    saveConfig(updated);
  }, []);

  const handleConfigClose = useCallback(() => {
    setMode("normal");
    void refreshAll();
  }, [refreshAll]);

  // Build tab descriptors ── Home first, then categories
  const homeUnread = unreadCounts[0] ?? 0;
  const homeTab = {
    key: "0",
    label: homeUnread > 0 ? `⌂  HOME (${homeUnread})` : "⌂  HOME",
    content: (
      <ArticleList
        items={activeTabIdx === HOME_IDX ? filteredItems : homeItems}
        activeIndex={activeTabIdx === HOME_IDX ? focusedIdx : 0}
        loading={loadingTabs.size > 0}
        seenLinks={seenLinks}
        categoryName="Home"
      />
    ),
  };

  const catTabs = config.categories.map((cat, i) => {
    const tabIdx = i + 1;
    const count = unreadCounts[tabIdx] ?? 0;
    const label = count > 0
      ? `${cat.icon}  ${cat.name.toUpperCase()} (${count})`
      : `${cat.icon}  ${cat.name.toUpperCase()}`;
    return {
      key: String(tabIdx),
      label,
      content: (
        <ArticleList
          items={activeTabIdx === tabIdx ? filteredItems : allCatItems[i] ?? []}
          activeIndex={activeTabIdx === tabIdx ? focusedIdx : 0}
          loading={loadingTabs.has(tabIdx)}
          seenLinks={seenLinks}
          categoryName={cat.name}
          categoryIcon={cat.icon}
        />
      ),
    };
  });

  const tabs = [homeTab, ...catTabs];
  const activeTabKey = String(activeTabIdx);

  const statusBarLabel = lastRefresh
    ? `Last refresh: ${lastRefresh.toTimeString().slice(0, 5)}`
    : undefined;
  const exitHint = statusMsg || " c config | r refresh | / search | ? help | q quit";

  if (mode === "help") {
    return (
      <ThemeProvider theme={catppuccinTheme}>
        <Box flexDirection="column" padding={1}>
          <HelpOverlay />
        </Box>
      </ThemeProvider>
    );
  }

  if (mode === "config") {
    return (
      <ThemeProvider theme={catppuccinTheme}>
        <Box flexDirection="column">
          <UsageMonitor.Header
            title="✦ RSSTERM — CONFIG ✦"
            titleColor="#cba6f7"
            decorator="◆"
            separatorChar="─"
          />
          <ConfigPanel
            config={config}
            onSave={handleConfigSave}
            onClose={handleConfigClose}
          />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={catppuccinTheme}>
      <Box flexDirection="column">
        <UsageMonitor.Header
          title="✦  RSSTERM  ✦"
          titleColor="#cba6f7"
          decorator="◆"
          separatorChar="─"
        />
        {mode === "search" && (
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        )}
        <Tabs
          tabs={tabs}
          activeTab={activeTabKey}
          onTabChange={(k) => {
            if (mode !== "normal") return;
            setActiveTabIdx(Number(k));
          }}
          borderStyle="single"
          tabBarPaddingX={3}
        />
        <Box borderStyle="single" borderColor="#45475a" paddingX={1}>
          <PreviewPane item={selectedItem} />
        </Box>
        <UsageMonitor.StatusBar
          clock
          clockColor="#a6e3a1"
          sessionLabel={statusBarLabel}
          sessionColor="#a6e3a1"
          exitHint={exitHint}
          statusDot={loadingTabs.size > 0 ? "yellow" : "green"}
        />
      </Box>
    </ThemeProvider>
  );
};
