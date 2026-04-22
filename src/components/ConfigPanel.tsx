import { Box, Text, useInput } from "ink";
import React, { useState, useCallback } from "react";
import { TextInput } from "@/components/ui/text-input.js";
import type { AppConfig } from "../lib/types.js";
import { youtubeUrlToRss, isYoutubeUrl } from "../lib/image.js";

type SubMode =
  | "browse"
  | "add-feed-name"
  | "add-feed-url"
  | "add-cat-name"
  | "pick-icon"
  | "edit-feed-name"
  | "edit-feed-url"
  | "confirm-delete";

interface ConfigPanelProps {
  config: AppConfig;
  onSave: (updated: AppConfig) => void;
  onClose: () => void;
}

// Icon options: [char, label, artLine]
const ICONS: [string, string, string][] = [
  ["●",  "dot",      " (●) "],
  ["󰖟",  "globe",    " 󰖟   "],
  ["󰊗",  "gamepad",  " 󰊗   "],
  ["󰋋",  "headphone"," 󰋋   "],
  ["📺", "video",    " 📺  "],
  ["📰", "news",     " 📰  "],
  ["🔬", "science",  " 🔬  "],
  ["🏆", "sports",   " 🏆  "],
  ["🎵", "music",    " 🎵  "],
  ["💻", "tech",     " 💻  "],
  ["🌍", "world",    " 🌍  "],
  ["⚡", "energy",   " ⚡  "],
];

type NavItem =
  | { type: "cat"; ci: number }
  | { type: "feed"; ci: number; fi: number };

function buildNavItems(config: AppConfig, expanded: Set<number>): NavItem[] {
  const items: NavItem[] = [];
  for (let ci = 0; ci < config.categories.length; ci++) {
    items.push({ type: "cat", ci });
    if (expanded.has(ci)) {
      const feeds = config.categories[ci]?.feeds ?? [];
      for (let fi = 0; fi < feeds.length; fi++) {
        items.push({ type: "feed", ci, fi });
      }
    }
  }
  return items;
}

export const ConfigPanel = ({ config, onSave, onClose }: ConfigPanelProps) => {
  const [subMode, setSubMode] = useState<SubMode>("browse");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [navIdx, setNavIdx] = useState(0);
  const [iconIdx, setIconIdx] = useState(0);

  // multi-step form fields
  const [feedName, setFeedName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [catName, setCatName] = useState("");
  // targetCatIdx: which category to add feed to
  const [targetCatIdx, setTargetCatIdx] = useState(0);

  const navItems = buildNavItems(config, expanded);
  const currentNav = navItems[navIdx];

  const resolvedCatIdx =
    currentNav?.type === "cat" ? currentNav.ci :
    currentNav?.type === "feed" ? currentNav.ci : 0;

  // ── ESC always cancels / closes ───────────────────────────────────────────
  useInput((input, key) => {
    if (key.escape) {
      if (subMode !== "browse") {
        setSubMode("browse");
      } else {
        onClose();
      }
      return;
    }

    // icon picker arrow keys
    if (subMode === "pick-icon") {
      if (key.leftArrow || input === "h") {
        setIconIdx(i => (i - 1 + ICONS.length) % ICONS.length);
        return;
      }
      if (key.rightArrow || input === "l") {
        setIconIdx(i => (i + 1) % ICONS.length);
        return;
      }
      if (key.return) {
        const icon = ICONS[iconIdx]?.[0] ?? "●";
        const updated: AppConfig = {
          ...config,
          categories: [...config.categories, { name: catName.trim(), icon, feeds: [] }],
        };
        onSave(updated);
        setNavIdx(navItems.length); // will point to new cat after re-render
        setSubMode("browse");
      }
      return;
    }

    if (subMode !== "browse") return;

    // ── browse mode ──────────────────────────────────────────────────────────
    if (input === "j" || key.downArrow) {
      setNavIdx(i => Math.min(navItems.length - 1, i + 1));
      return;
    }
    if (input === "k" || key.upArrow) {
      setNavIdx(i => Math.max(0, i - 1));
      return;
    }
    if (key.return) {
      if (currentNav?.type === "cat") {
        const ci = currentNav.ci;
        setExpanded(prev => {
          const next = new Set(prev);
          next.has(ci) ? next.delete(ci) : next.add(ci);
          return next;
        });
      }
      return;
    }

    // a → add feed to current/parent category
    if (input === "a") {
      setTargetCatIdx(resolvedCatIdx);
      setFeedName(""); setFeedUrl("");
      setSubMode("add-feed-name");
      return;
    }
    // n → new category (always)
    if (input === "n") {
      setCatName(""); setIconIdx(0);
      setSubMode("add-cat-name");
      return;
    }
    // e → edit selected feed
    if (input === "e" && currentNav?.type === "feed") {
      const feed = config.categories[currentNav.ci]?.feeds[currentNav.fi];
      if (feed) {
        setFeedName(feed.name);
        setFeedUrl(feed.url);
        setSubMode("edit-feed-name");
      }
      return;
    }
    // d → delete
    if (input === "d") {
      setSubMode("confirm-delete");
      return;
    }
    // s → save without closing
    if (input === "s") {
      onSave(config);
      return;
    }
  });

  // ── form completions ──────────────────────────────────────────────────────
  const submitFeedName = useCallback(() => {
    if (feedName.trim()) setSubMode("add-feed-url");
  }, [feedName]);

  const submitFeedUrl = useCallback((submittedUrl: string) => {
    const rawUrl = submittedUrl.trim() || feedUrl.trim();
    const finalUrl = isYoutubeUrl(rawUrl) ? (youtubeUrlToRss(rawUrl) ?? rawUrl) : rawUrl;
    if (feedName.trim() && finalUrl) {
      const updated: AppConfig = {
        ...config,
        categories: config.categories.map((cat, i) =>
          i === targetCatIdx
            ? { ...cat, feeds: [...cat.feeds, { name: feedName.trim(), url: finalUrl }] }
            : cat
        ),
      };
      onSave(updated);
      setExpanded(prev => new Set(prev).add(targetCatIdx));
    }
    setSubMode("browse");
  }, [feedName, feedUrl, targetCatIdx, config, onSave]);

  const submitEditFeedName = useCallback(() => {
    if (feedName.trim()) setSubMode("edit-feed-url");
  }, [feedName]);

  const submitEditFeedUrl = useCallback((submittedUrl: string) => {
    const rawUrl = submittedUrl.trim() || feedUrl.trim();
    const finalUrl = isYoutubeUrl(rawUrl) ? (youtubeUrlToRss(rawUrl) ?? rawUrl) : rawUrl;
    if (currentNav?.type === "feed") {
      const { ci, fi } = currentNav;
      const updated: AppConfig = {
        ...config,
        categories: config.categories.map((cat, i) =>
          i === ci
            ? { ...cat, feeds: cat.feeds.map((f, j) =>
                j === fi ? { name: feedName.trim() || f.name, url: finalUrl || f.url } : f
              )}
            : cat
        ),
      };
      onSave(updated);
    }
    setSubMode("browse");
  }, [feedName, feedUrl, currentNav, config, onSave]);

  const submitCatName = useCallback(() => {
    if (catName.trim()) setSubMode("pick-icon");
  }, [catName]);

  const confirmDelete = useCallback((input: string) => {
    if (input === "y" || input === "Y") {
      if (currentNav?.type === "feed") {
        const { ci, fi } = currentNav;
        const updated: AppConfig = {
          ...config,
          categories: config.categories.map((cat, i) =>
            i === ci ? { ...cat, feeds: cat.feeds.filter((_, j) => j !== fi) } : cat
          ),
        };
        onSave(updated);
        setNavIdx(n => Math.max(0, n - 1));
      } else if (currentNav?.type === "cat") {
        const ci = currentNav.ci;
        const updated: AppConfig = {
          ...config,
          categories: config.categories.filter((_, i) => i !== ci),
        };
        onSave(updated);
        setNavIdx(n => Math.max(0, n - 1));
      }
    }
    setSubMode("browse");
  }, [currentNav, config, onSave]);

  // ── render ────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (subMode === "add-feed-name" || subMode === "edit-feed-name") {
      const target = config.categories[targetCatIdx]?.name ?? "";
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
          <Text color="#cba6f7" bold>
            {subMode === "add-feed-name" ? `Add feed  →  ${target}` : "Edit feed — name"}
          </Text>
          <TextInput
            value={feedName}
            onChange={setFeedName}
            onSubmit={subMode === "add-feed-name" ? submitFeedName : submitEditFeedName}
            placeholder="Feed display name"
            autoFocus
            width={52}
          />
          <Text dimColor>Enter → next step  ·  Esc → cancel</Text>
        </Box>
      );
    }

    if (subMode === "add-feed-url" || subMode === "edit-feed-url") {
      const urlHint = isYoutubeUrl(feedUrl)
        ? `  → YouTube: ${youtubeUrlToRss(feedUrl) ?? "paste full channel URL"}`
        : "";
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
          <Text color="#cba6f7" bold>
            {subMode === "add-feed-url" ? "Add feed — URL" : "Edit feed — URL"}
          </Text>
          <Text dimColor>Name: <Text color="#cdd6f4">{feedName}</Text></Text>
          <TextInput
            value={feedUrl}
            onChange={setFeedUrl}
            onSubmit={subMode === "add-feed-url" ? submitFeedUrl : submitEditFeedUrl}
            placeholder="https://...  or youtube.com/channel/..."
            autoFocus
            width={60}
          />
          {urlHint ? <Text color="#a6e3a1">{urlHint}</Text> : null}
          <Text dimColor>Enter → save  ·  Esc → cancel  ·  YouTube URLs auto-convert</Text>
        </Box>
      );
    }

    if (subMode === "add-cat-name") {
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
          <Text color="#cba6f7" bold>New category — name</Text>
          <TextInput
            value={catName}
            onChange={setCatName}
            onSubmit={submitCatName}
            placeholder="e.g. Science"
            autoFocus
            width={40}
          />
          <Text dimColor>Enter → pick icon  ·  Esc → cancel</Text>
        </Box>
      );
    }

    if (subMode === "pick-icon") {
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
          <Text color="#cba6f7" bold>
            Pick icon for <Text color="#cdd6f4">{catName}</Text>
          </Text>
          <Box gap={1} flexWrap="wrap">
            {ICONS.map(([icon, label], i) => {
              const active = i === iconIdx;
              return (
                <Box
                  key={i}
                  borderStyle="single"
                  borderColor={active ? "#cba6f7" : "#313244"}
                  paddingX={1}
                >
                  <Text color={active ? "#cba6f7" : "#a6adc8"} bold={active}>
                    {icon} {label}
                  </Text>
                </Box>
              );
            })}
          </Box>
          <Box marginTop={1} gap={2}>
            <Text color="#cba6f7" bold>
              Selected: {ICONS[iconIdx]?.[0]}  {ICONS[iconIdx]?.[1]}
            </Text>
          </Box>
          <Text dimColor>← → navigate  ·  Enter → create  ·  Esc → back</Text>
        </Box>
      );
    }

    if (subMode === "confirm-delete") {
      const label =
        currentNav?.type === "feed"
          ? config.categories[currentNav.ci]?.feeds[currentNav.fi]?.name
          : currentNav?.type === "cat"
          ? config.categories[currentNav.ci]?.name
          : "?";
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1} gap={1}>
          <Text color="#f38ba8" bold>Delete "{label}"?</Text>
          <Text dimColor>
            Press <Text color="#a6e3a1" bold>y</Text> to confirm, any other key to cancel.
          </Text>
          {/* Capture y/n via a separate useInput — handled inline */}
          <ConfirmInput onConfirm={confirmDelete} />
        </Box>
      );
    }

    // browse mode
    return (
      <Box flexDirection="column" paddingX={1}>
        {navItems.length === 0 && (
          <Box paddingX={2} paddingY={1}>
            <Text dimColor>
              No categories.  Press <Text color="#a6e3a1">n</Text> to create one.
            </Text>
          </Box>
        )}
        {navItems.map((nav, i) => {
          const isActive = i === navIdx;
          if (nav.type === "cat") {
            const cat = config.categories[nav.ci]!;
            const isExp = expanded.has(nav.ci);
            return (
              <Box key={`c${nav.ci}`} paddingX={1} gap={1}>
                <Text color={isActive ? "#cba6f7" : "#585b70"} bold={isActive}>
                  {isActive ? "▶" : " "}
                </Text>
                <Text color={isActive ? "#cba6f7" : "#cdd6f4"} bold={isActive}>
                  {cat.icon}  {cat.name}
                </Text>
                <Text color={isActive ? "#cba6f7" : "#45475a"}>
                  {isExp ? "▾" : "▸"}
                </Text>
                <Text dimColor>
                  {cat.feeds.length} feed{cat.feeds.length !== 1 ? "s" : ""}
                </Text>
              </Box>
            );
          } else {
            const feed = config.categories[nav.ci]!.feeds[nav.fi]!;
            return (
              <Box key={`f${nav.ci}-${nav.fi}`} paddingX={1} gap={1} marginLeft={3}>
                <Text color={isActive ? "#fab387" : "#45475a"}>
                  {isActive ? "▶" : "·"}
                </Text>
                <Text color={isActive ? "#cdd6f4" : "#7f849c"} bold={isActive}>
                  {feed.name.padEnd(22)}
                </Text>
                <Text color="#45475a" wrap="truncate">
                  {feed.url.slice(0, 48)}
                </Text>
              </Box>
            );
          }
        })}
      </Box>
    );
  };

  const hintLine = subMode === "browse"
    ? "j/k navigate  ·  Enter expand  ·  a add feed  ·  n new category  ·  e edit  ·  d delete  ·  Esc close"
    : "Esc → cancel";

  return (
    <Box flexDirection="column">
      <Box paddingX={2} paddingY={1} gap={3}>
        <Text color="#cba6f7" bold>  FEEDS</Text>
        <Text dimColor>
          <Text color="#a6e3a1" bold>a</Text> add feed  ·
          <Text color="#89b4fa" bold> n</Text> new cat  ·
          <Text color="#fab387" bold> e</Text> edit  ·
          <Text color="#f38ba8" bold> d</Text> delete  ·
          <Text color="#cba6f7" bold> s</Text> save
        </Text>
      </Box>
      <Box borderStyle="single" borderColor="#45475a" marginX={1} />
      {renderContent()}
      <Box borderStyle="single" borderColor="#45475a" marginX={1} />
      <Box paddingX={2} paddingY={0}>
        <Text dimColor>{hintLine}</Text>
      </Box>
    </Box>
  );
};

// Separate component so its useInput doesn't interfere with ConfigPanel's
const ConfirmInput = ({ onConfirm }: { onConfirm: (input: string) => void }) => {
  useInput((input) => { onConfirm(input); });
  return null;
};
