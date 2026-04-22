import { Box, Text } from "ink";
import React from "react";

const KEYBINDS: [string, string][] = [
  ["j / ↓", "Move down"],
  ["k / ↑", "Move up"],
  ["← / h", "Previous tab"],
  ["→ / l", "Next tab"],
  ["o / Enter", "Open in browser"],
  ["r", "Refresh active tab"],
  ["R", "Refresh all tabs"],
  ["/", "Toggle search"],
  ["c", "Open config panel"],
  ["Esc", "Exit search / close help / config"],
  ["?", "Toggle help"],
  ["q", "Quit"],
];

export const HelpOverlay = () => (
  <Box
    flexDirection="column"
    borderStyle="round"
    borderColor="#cba6f7"
    paddingX={2}
    paddingY={1}
    gap={0}
  >
    <Text color="#cba6f7" bold>
      Keyboard shortcuts
    </Text>
    <Text> </Text>
    {KEYBINDS.map(([kbd, desc]) => (
      <Box key={kbd} gap={2}>
        <Text color="#fab387" bold>
          {kbd.padEnd(12)}
        </Text>
        <Text color="#cdd6f4">{desc}</Text>
      </Box>
    ))}
    <Text> </Text>
    <Text dimColor>Press ? or Esc to close</Text>
  </Box>
);
