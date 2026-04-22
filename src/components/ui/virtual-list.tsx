import { Box, Text } from "ink";
import React, { useMemo, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useTheme } from "@/components/ui/theme-provider";

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isActive: boolean) => ReactNode;
  height: number;
  activeIndex: number;
  overscan?: number;
}

export const VirtualList = <T,>({
  items,
  renderItem,
  height,
  activeIndex,
  overscan = 2,
}: VirtualListProps<T>) => {
  const theme = useTheme();
  const [windowStart, setWindowStart] = useState(0);

  useEffect(() => {
    setWindowStart((ws) => {
      if (activeIndex < ws) return activeIndex;
      if (activeIndex >= ws + height) return activeIndex - height + 1;
      return ws;
    });
  }, [activeIndex, height]);

  const visibleStart = Math.max(0, windowStart - overscan);
  const visibleEnd = Math.min(items.length, windowStart + height + overscan);
  const visibleItems = useMemo(
    () => items.slice(visibleStart, visibleEnd),
    [items, visibleStart, visibleEnd]
  );

  const thumbSize = Math.max(1, Math.floor((height * height) / items.length));
  const thumbPosition =
    items.length <= height
      ? 0
      : Math.floor((activeIndex / (items.length - 1)) * (height - thumbSize));

  const scrollbar = useMemo(
    () =>
      Array.from({ length: height }, (_, i) => {
        if (i >= thumbPosition && i < thumbPosition + thumbSize) {
          return "█";
        }
        return "│";
      }),
    [height, thumbPosition, thumbSize]
  );

  return (
    <Box flexDirection="row">
      <Box flexDirection="column" flexGrow={1}>
        {visibleItems.map((item, localIdx) => {
          const globalIdx = visibleStart + localIdx;
          const isVisible =
            globalIdx >= windowStart && globalIdx < windowStart + height;
          if (!isVisible) {
            return null;
          }
          const isActive = globalIdx === activeIndex;
          return (
            <Box key={globalIdx}>{renderItem(item, globalIdx, isActive)}</Box>
          );
        })}
      </Box>
      {items.length > height && (
        <Box flexDirection="column" marginLeft={1}>
          {scrollbar.map((char, i) => (
            <Text
              key={i}
              color={
                char === "█"
                  ? theme.colors.primary
                  : theme.colors.mutedForeground
              }
            >
              {char}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};
