// Keyed by category name (case-insensitive) OR icon character
const NAME_ART: Record<string, string[]> = {
  home: [
    "  /\\  /\\  ",
    " /  \\/  \\ ",
    "/___/\\___\\",
  ],
  tech: [
    " ┌─[CPU]─┐ ",
    " │ ■ □ ■ │ ",
    " └───────┘ ",
  ],
  gaming: [
    " ┌─╦─┬─╦─┐",
    " │ ◉ │ ◉ │",
    " └───┴───┘ ",
  ],
  podcasts: [
    "  (( )) ",
    " ((|●|))",
    "  (( )) ",
  ],
  news: [
    " ┌──────┐ ",
    " │ NEWS │ ",
    " └──────┘ ",
  ],
  science: [
    "  ≈∿≈∿≈  ",
    " ╔══════╗ ",
    " ╚══════╝ ",
  ],
  sports: [
    "  ╱╲  ╱╲ ",
    " ╱ ◎╲╱  ╲",
    " ╲  ╱╲  ╱",
  ],
  music: [
    "  ♩ ♪ ♫  ",
    " ┌──────┐ ",
    " └──────┘ ",
  ],
  video: [
    " ┌▶──────┐",
    " │  ▶▶▶  │",
    " └────────┘",
  ],
  youtube: [
    " ┌▶──────┐",
    " │  ▶▶▶  │",
    " └────────┘",
  ],
};

const ICON_ART: Record<string, string[]> = {
  "📺": [
    " ┌▶──────┐",
    " │  ▶▶▶  │",
    " └────────┘",
  ],
  "📰": [
    " ┌────────┐",
    " │▬▬ ▬▬▬▬│",
    " └────────┘",
  ],
  "🔬": [
    "   ≈∿≈   ",
    "  ╱   ╲  ",
    " ╰─────╯ ",
  ],
  "🏆": [
    " ┌─╨─┐  ",
    " │╔═╗│  ",
    " └─┴─┘  ",
  ],
  "🎵": [
    "  ♩ ♪ ♫  ",
    "  ♬ ♭ ♮  ",
    "          ",
  ],
  "💻": [
    " ┌──────┐ ",
    " │ >_   │ ",
    " └──────┘ ",
  ],
  "🌍": [
    "  ╭────╮  ",
    " │ ◉──◉ │ ",
    "  ╰────╯  ",
  ],
  "⚡": [
    "   ╱╲    ",
    "  ╱  ╲   ",
    " ╱ ⚡ ╲  ",
  ],
  "●": [
    "  ╭────╮  ",
    " │ ●  ● │ ",
    "  ╰────╯  ",
  ],
};

const DEFAULT_ART: string[] = [
  " ╔══════╗ ",
  " ║ RSS  ║ ",
  " ╚══════╝ ",
];

export function getCategoryArt(name: string, icon?: string): string[] {
  const key = name.trim().toLowerCase();
  if (NAME_ART[key]) return NAME_ART[key]!;
  if (icon && ICON_ART[icon]) return ICON_ART[icon]!;
  return DEFAULT_ART;
}
