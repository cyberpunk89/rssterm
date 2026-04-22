# rssterm — Build Spec for Claude Code

A terminal RSS reader built with Ink + termcn, themed with Catppuccin Mocha.

---

## Stack

- **Runtime:** Node.js with TypeScript
- **Terminal UI:** [Ink](https://github.com/vadimdemedes/ink) + [termcn](https://www.termcn.dev)
- **RSS parsing:** `rss-parser`
- **Config:** `js-yaml` reading from `~/.config/rssterm/config.yaml`
- **Cache:** JSON file at `~/.config/rssterm/cache.json`
- **Package manager:** pnpm

---

## Project Structure

```
rssterm/
├── src/
│   ├── index.tsx           # Entry point, renders <App />
│   ├── app.tsx             # Root component, tab state, refresh logic
│   ├── components/
│   │   ├── ArticleList.tsx # VirtualList of feed items for active tab
│   │   └── PreviewPane.tsx # Description preview for selected item
│   └── lib/
│       ├── rss.ts          # Fetch + parse RSS feeds via rss-parser
│       ├── cache.ts        # Read/write cache.json
│       └── config.ts       # Load and validate config.yaml
├── config.example.yaml
├── package.json
└── tsconfig.json
```

---

## termcn Components to Use

| Component | Import | Purpose |
|---|---|---|
| `Tabs` | `@termcn/tabs` | Category tabs (Tech / Gaming / Podcasts) |
| `VirtualList` | `@termcn/virtual-list` | Scrollable article list |
| `Spinner` | `@termcn/spinner` | Loading state while fetching |
| `UsageMonitor.Header` | `@termcn/usage-monitor` | App title with ◆ decorator |
| `UsageMonitor.StatusBar` | `@termcn/usage-monitor` | Bottom bar: clock, last refresh, keybinds |
| `ThemeProvider` | `@termcn/theme-catppuccin` | Catppuccin Mocha theme |

Install components with:

```bash
pnpm dlx shadcn@latest add @termcn/tabs
pnpm dlx shadcn@latest add @termcn/virtual-list
pnpm dlx shadcn@latest add @termcn/spinner
pnpm dlx shadcn@latest add @termcn/usage-monitor
pnpm dlx shadcn@latest add @termcn/theme-catppuccin
```

---

## Config File

Location: `~/.config/rssterm/config.yaml`

```yaml
refreshOnStart: true

categories:
  - name: Tech
    icon: "󰖟"
    feeds:
      - name: The Verge
        url: https://www.theverge.com/rss/index.xml

  - name: Gaming
    icon: "󰊗"
    feeds:
      - name: IGN
        url: https://feeds.feedburner.com/ign/all

  - name: Podcasts
    icon: "󰋋"
    feeds:
      - name: Hello from the Magic Tavern
        url: https://feeds.simplecast.com/XwOnFbuU
      - name: Beyond Podcast
        url: https://feeds.buzzsprout.com/2044329.rss
```

---

## Cache File

Location: `~/.config/rssterm/cache.json`

```ts
type CacheEntry = {
  feedUrl: string;
  fetchedAt: string; // ISO timestamp
  items: FeedItem[];
};

type Cache = {
  [feedUrl: string]: CacheEntry;
};
```

On startup: load cache first, then fetch fresh if `refreshOnStart: true`. On manual refresh (`r`): re-fetch all feeds in the active tab.

---

## Feed Item Type

```ts
type FeedItem = {
  title: string;
  link: string;
  pubDate: string | null; // ISO string
  description: string;    // Plain text, strip HTML, max 200 chars
  source: string;         // Feed name e.g. "The Verge"
};
```

---

## App Layout

```
┌─────────────────────────────────────────┐
│  ◆ ✦ RSSTERM ✦ ◆                        │  ← UsageMonitor.Header
├─────────────────────────────────────────┤
│  [ Tech ]  [ Gaming ]  [ Podcasts ]     │  ← Tabs (← → to switch)
├─────────────────────────────────────────┤
│                                         │
│  ● Title of article one       [Verge]  2h ago  │  ← VirtualList
│  ● Title of article two       [IGN]    5h ago  │
│ ▶ ● Selected article title    [Verge]  1d ago  │  ← highlighted row
│  ● Title of article four      [IGN]    1d ago  │
│                                         │
├─────────────────────────────────────────┤
│  Preview: Short description of selected │  ← PreviewPane (3 lines max)
│  article goes here, stripped of HTML.   │
├─────────────────────────────────────────┤
│  ●  Last refresh: 14:32  │  r refresh  │  ← UsageMonitor.StatusBar
│     ↑↓ navigate  │  o open  │  ? help  │
└─────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `←` / `h` | Previous tab |
| `→` / `l` | Next tab |
| `o` or `Enter` | Open selected article in browser (`xdg-open`) |
| `r` | Refresh feeds in active tab |
| `R` | Refresh all feeds |
| `/` | Toggle search mode |
| `?` | Toggle help overlay |
| `q` | Quit |

---

## Catppuccin Mocha Color Mapping

| UI Element | Mocha Token | Hex |
|---|---|---|
| Background | `base` | `#1e1e2e` |
| Tab bar | `mantle` | `#181825` |
| Active tab | `lavender` | `#b4befe` |
| Inactive tab | `subtext0` | `#a6adc8` |
| Selected row | `mauve` | `#cba6f7` |
| Timestamps | `green` | `#a6e3a1` |
| Source badge | `peach` | `#fab387` |
| Preview text | `text` | `#cdd6f4` |
| Spinner | `blue` | `#89b4fa` |
| Status bar | `surface1` | `#45475a` |
| Error | `red` | `#f38ba8` |

Apply via `ThemeProvider` with the Catppuccin theme. Override individual colors using Ink's `<Text color="...">` with hex values where needed.

---

## RSS Fetching

Use `rss-parser`. Strip HTML from descriptions with a simple regex or `striptags`. Limit description to 200 characters.

```ts
import Parser from 'rss-parser';
const parser = new Parser();

async function fetchFeed(url: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(url);
  return feed.items.map(item => ({
    title: item.title ?? 'No title',
    link: item.link ?? '',
    pubDate: item.pubDate ?? null,
    description: stripHtml(item.contentSnippet ?? item.content ?? '').slice(0, 200),
    source: feed.title ?? url,
  }));
}
```

---

## Unread Count Badge

Track which items were seen in the current session using a `Set<string>` keyed by article link. Show unread count on each tab label: `Tech (12)`. Resets on restart — no persistence needed.

---

## Search Mode

When `/` is pressed:
- Show a text input below the tab bar (use Ink's `useInput` or termcn `TextInput`)
- Filter the active tab's item list in real time
- `Escape` clears search and returns to normal navigation

---

## Error Handling

- If a feed fails to fetch: show a `[ERR]` badge next to the feed source name in the list
- Fall back to cached items if available
- Show error details in the status bar

---

## Installation Steps for CachyOS + Fish

```bash
# Clone / init project
mkdir rssterm && cd rssterm
pnpm init
pnpm add ink react rss-parser js-yaml
pnpm add -D typescript @types/react @types/node ts-node

# Init termcn (Ink-based)
pnpm dlx shadcn@latest init

# Add termcn components
pnpm dlx shadcn@latest add @termcn/tabs
pnpm dlx shadcn@latest add @termcn/virtual-list
pnpm dlx shadcn@latest add @termcn/spinner
pnpm dlx shadcn@latest add @termcn/usage-monitor
pnpm dlx shadcn@latest add @termcn/theme-catppuccin

# Create config dir
mkdir -p ~/.config/rssterm
cp config.example.yaml ~/.config/rssterm/config.yaml

# Run
pnpm ts-node src/index.tsx
```

Add a fish alias for convenience:

```fish
# ~/.config/fish/config.fish
alias rss="pnpm --prefix ~/rssterm ts-node ~/rssterm/src/index.tsx"
```

---

## Nice-to-Have (Post MVP)

- `xdg-open` fallback detection (check if Kitty has `open-url` action configured)
- Per-feed color accent in config.yaml
- `--category` CLI flag to open directly on a specific tab
