import { Box, Text } from "ink";
import React from "react";
import { VirtualList } from "@/components/ui/virtual-list.js";
import { Spinner } from "@/components/ui/spinner.js";
import type { FeedItem } from "../lib/types.js";
import { formatRelative } from "../lib/dates.js";
import { getCategoryArt } from "../lib/ascii-art.js";

interface ArticleListProps {
  items: FeedItem[];
  activeIndex: number;
  loading: boolean;
  seenLinks: Set<string>;
  categoryName: string;
  categoryIcon?: string;
}

const LIST_HEIGHT = 10;

export const ArticleList = ({
  items,
  activeIndex,
  loading,
  seenLinks,
  categoryName,
  categoryIcon,
}: ArticleListProps) => {
  const art = getCategoryArt(categoryName, categoryIcon);

  const header = (
    <Box flexDirection="row" alignItems="center" gap={2} paddingX={1} paddingY={0}>
      <Box flexDirection="column">
        {art.map((line, i) => (
          <Text key={i} color="#cba6f7" dimColor={false}>
            {line}
          </Text>
        ))}
      </Box>
      <Box flexDirection="column">
        <Text color="#cba6f7" bold>
          {categoryName.toUpperCase()}
        </Text>
        <Text color="#a6adc8" dimColor>
          {items.length} article{items.length !== 1 ? "s" : ""}
          {loading ? "  ⟳ refreshing" : ""}
        </Text>
      </Box>
    </Box>
  );

  if (loading && items.length === 0) {
    return (
      <Box flexDirection="column">
        {header}
        <Box paddingX={2} paddingY={1} gap={1}>
          <Spinner label="Fetching feeds..." />
        </Box>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box flexDirection="column">
        {header}
        <Box paddingX={2} paddingY={1}>
          <Text dimColor>No articles cached. Press r to refresh.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {header}
      <Box borderStyle="single" borderColor="#313244" marginX={1} />
      <VirtualList
        items={items}
        activeIndex={activeIndex}
        height={LIST_HEIGHT}
        renderItem={(item, _idx, isActive) => {
          const isNew = !seenLinks.has(item.link);
          const title =
            item.title.length > 55
              ? item.title.slice(0, 54) + "…"
              : item.title;

          if (isActive) {
            return (
              <Box paddingX={1} gap={1}>
                <Text inverse color="#cba6f7" bold>
                  {" ▶ " + title.padEnd(56)}
                </Text>
                <Text inverse color="#fab387">
                  {`[${item.source.slice(0, 12)}]`.padEnd(16)}
                </Text>
                {item.hasError && <Text color="#f38ba8" bold>[ERR]</Text>}
                <Text inverse color="#a6e3a1">
                  {formatRelative(item.pubDate).padEnd(10)}
                </Text>
              </Box>
            );
          }

          return (
            <Box paddingX={1} gap={1}>
              <Text color={isNew ? "#cdd6f4" : "#a6adc8"} bold={isNew}>
                {"   " + title.padEnd(56)}
              </Text>
              <Text color="#fab387" dimColor={!isNew}>
                {`[${item.source.slice(0, 12)}]`.padEnd(16)}
              </Text>
              {item.hasError && <Text color="#f38ba8">[ERR]</Text>}
              <Text color="#a6e3a1" dimColor>
                {formatRelative(item.pubDate)}
              </Text>
            </Box>
          );
        }}
      />
    </Box>
  );
};

export { LIST_HEIGHT };
