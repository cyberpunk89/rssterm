# rssterm

A keyboard-driven terminal RSS reader built with [Ink](https://github.com/vadimdemedes/ink) (React for the terminal), [termcn](https://www.termcn.dev) components, and the Catppuccin Mocha theme.

```
◆   ✦ RSSTERM ✦   ◆
────────────────────────────────────────────────────
⌂  HOME │ 󰖟  TECH (3) │ 󰊗  GAMING │ 󰋋  PODCASTS
┌───────────────────────────────────────────────────┐
│  ┌─[CPU]─┐  TECH                    12 articles  │
│  │ ■ □ ■ │                                       │
│  └───────┘                                       │
│  ─────────────────────────────────────────────── │
│ ▶ Against the Web            [The Verge]  2h ago  │
│   The Future of Open AI      [The Verge]  5h ago  │
│   New Switch 2 Details       [IGN      ]  1d ago  │
└───────────────────────────────────────────────────┘
┌──────────────┬────────────────────────────────────┐
│  [ image ]   │ Against the Web                    │
│              │ The Verge · 2h ago                 │
│              │                                    │
│              │ Explores the latest thinking in    │
│              │ browser development and the open   │
│              │ web platform...                    │
└──────────────┴────────────────────────────────────┘
|⏰ 14:32 |📄 Last refresh: 14:31 | c config | ? help |●
```

## Features

- **Home tab** — combined feed from all categories, deduplicated and sorted newest first
- **Category tabs** with ASCII art headers and unread counts
- **Preview pane** with inline image rendering (uses `terminal-image`, no external tools needed)
- **In-app config editor** — add/edit/remove feeds and categories without touching YAML
- **YouTube RSS** — paste any YouTube channel URL, auto-converts to RSS feed
- **Icon picker** — visual selection when creating a category
- **Search** — live fuzzy filter by title or source across the active tab
- **Vim-style navigation** — `j`/`k`/`h`/`l` + arrow keys, tabs loop around
- Cache-first startup — shows stale content instantly while refreshing in background

---

## Requirements

- Node.js ≥ 20
- pnpm

---

## Installation

```bash
git clone <repo-url> rssterm
cd rssterm
pnpm install

# Create config directory and copy the example config
mkdir -p ~/.config/rssterm
cp config.example.yaml ~/.config/rssterm/config.yaml

# Edit the config to add your feeds
$EDITOR ~/.config/rssterm/config.yaml

# Run
pnpm start
```

**Optional shell alias** (fish):

```fish
# ~/.config/fish/config.fish
alias rss="pnpm --prefix ~/path/to/rssterm start"
```

---

## Configuration

Config file: `~/.config/rssterm/config.yaml`

```yaml
refreshOnStart: true      # fetch all feeds on startup (use false to load from cache only)

categories:
  - name: Tech
    icon: "󰖟"             # any single character — Nerd Font glyphs, emoji, ASCII
    feeds:
      - name: The Verge
        url: https://www.theverge.com/rss/index.xml
      - name: Hacker News
        url: https://news.ycombinator.com/rss

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
```

You can also manage feeds from inside the app — press `c` to open the config panel.

### YouTube channels

Paste any YouTube channel URL when adding a feed — rssterm converts it automatically:

| Input | Converted to |
|---|---|
| `https://youtube.com/channel/UCxxxxxxx` | `https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxx` |
| `https://youtube.com/@handle` | `https://www.youtube.com/feeds/videos.xml?channel_id=@handle` |
| `https://youtube.com/c/name` | `https://www.youtube.com/feeds/videos.xml?user=name` |

---

## Keybindings

### Normal mode

| Key | Action |
|---|---|
| `j` / `↓` | Move down |
| `k` / `↑` | Move up |
| `h` / `←` | Previous tab (wraps) |
| `l` / `→` | Next tab (wraps) |
| `o` / `Enter` | Open selected article in browser |
| `r` | Refresh active tab |
| `R` | Refresh all tabs |
| `/` | Search mode |
| `c` | Config panel |
| `?` | Help overlay |
| `q` | Quit |

### Search mode

| Key | Action |
|---|---|
| Any text | Live filter by title or source name |
| `Esc` | Clear search, return to normal |

### Config panel (`c`)

| Key | Action |
|---|---|
| `j` / `k` | Navigate categories and feeds |
| `Enter` | Expand / collapse category |
| `a` | Add feed to selected category |
| `n` | New category |
| `e` | Edit selected feed |
| `d` | Delete selected item |
| `s` | Save without closing |
| `Esc` | Save and close |

When adding a feed URL, YouTube channel URLs are detected and a preview of the converted RSS URL is shown inline.

When creating a category, an icon picker lets you choose from a set of options using `←` / `→`.

---

## Project structure

```
src/
├── index.tsx                   # Entry point
├── app.tsx                     # Root component — all state, keybindings, refresh logic
├── components/
│   ├── ArticleList.tsx         # Scrollable article list with ASCII art header
│   ├── PreviewPane.tsx         # Image + title + description for selected article
│   ├── SearchBar.tsx           # Live search input
│   ├── HelpOverlay.tsx         # Keybinding reference
│   ├── ConfigPanel.tsx         # In-app feed/category editor
│   └── ui/                     # termcn components (installed via shadcn registry)
├── hooks/
│   ├── use-input.ts            # Ink useInput re-export
│   ├── use-focus.ts            # Ink useFocus re-export
│   ├── use-interval.ts         # setInterval hook
│   └── use-animation.ts        # Frame counter for spinner
└── lib/
    ├── types.ts                # Shared TypeScript interfaces
    ├── config.ts               # loadConfig() / saveConfig()
    ├── cache.ts                # loadCache() / saveCache()
    ├── rss.ts                  # fetchFeed() — rss-parser + image URL extraction
    ├── dates.ts                # formatRelative()
    ├── open.ts                 # openInBrowser() via xdg-open
    ├── image.ts                # fetchImageAsLines() + YouTube URL conversion
    ├── ascii-art.ts            # getCategoryArt() lookup table
    └── terminal-themes/
        ├── catppuccin.ts       # Catppuccin Mocha tokens
        └── default.ts          # Fallback theme
```

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js + TypeScript via `tsx` |
| UI framework | [Ink 7](https://github.com/vadimdemedes/ink) — React for the terminal |
| Components | [termcn](https://www.termcn.dev) — shadcn for Ink |
| Theme | Catppuccin Mocha |
| RSS parsing | `rss-parser` |
| Image rendering | `terminal-image` (pure JS, no binaries) |
| Config | YAML via `js-yaml` |
| Package manager | pnpm |

---

## Development

```bash
# Type check
pnpm typecheck

# Run in development
pnpm start
```

Cache is stored at `~/.config/rssterm/cache.json`. Delete it to force a cold start.

---

## Customization

### Theme

Colors are defined in `src/lib/terminal-themes/catppuccin.ts`. Change any hex value and restart.

### ASCII art headers

`src/lib/ascii-art.ts` contains a lookup table keyed by category name and icon character. Add entries to give any category its own art.

### Article list height

In `src/components/ArticleList.tsx`:

```ts
const LIST_HEIGHT = 10; // visible rows
```

### Adding a keybinding

1. Add a branch inside the `useInput` handler in `src/app.tsx`
2. Add it to `KEYBINDS` in `src/components/HelpOverlay.tsx`

---

## License

MIT
