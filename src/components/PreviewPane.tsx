import { Box, Text } from "ink";
import React, { useState, useEffect, useRef } from "react";
import type { FeedItem } from "../lib/types.js";
import { formatRelative } from "../lib/dates.js";
import { fetchImageAsLines } from "../lib/image.js";

interface PreviewPaneProps {
  item: FeedItem | null;
}

const IMG_COLS = 26;
const IMG_ROWS = 8;

type ImgState = "idle" | "loading" | "done" | "error";

function useArticleImage(imageUrl: string | undefined) {
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<ImgState>("idle");
  const prevUrlRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setLines([]);
      setStatus("idle");
      return;
    }
    if (imageUrl === prevUrlRef.current) return;

    // cancel any in-flight fetch
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    prevUrlRef.current = imageUrl;
    setLines([]);
    setStatus("loading");

    fetchImageAsLines(imageUrl, IMG_COLS, IMG_ROWS)
      .then((result) => {
        setLines(result);
        setStatus("done");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [imageUrl]);

  return { lines, status };
}

export const PreviewPane = ({ item }: PreviewPaneProps) => {
  const { lines, status } = useArticleImage(item?.imageUrl);

  if (!item) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text dimColor>No article selected.</Text>
      </Box>
    );
  }

  const imageBlock = (
    <Box
      flexDirection="column"
      width={IMG_COLS + 2}
      minWidth={IMG_COLS + 2}
      height={IMG_ROWS + 2}
      borderStyle="single"
      borderColor="#313244"
      overflow="hidden"
    >
      {!item.imageUrl ? (
        <Box alignItems="center" justifyContent="center" flexGrow={1}>
          <Text dimColor>no image</Text>
        </Box>
      ) : status === "loading" ? (
        <Box alignItems="center" justifyContent="center" flexGrow={1}>
          <Text color="#89b4fa">⟳ loading</Text>
        </Box>
      ) : status === "error" || lines.length === 0 ? (
        <Box alignItems="center" justifyContent="center" flexGrow={1}>
          <Text dimColor>[ img ]</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {lines.slice(0, IMG_ROWS).map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Box flexDirection="row" paddingX={1} paddingY={1} gap={1}>
      {imageBlock}
      <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
        <Text color="#cba6f7" bold wrap="truncate">
          {item.title}
        </Text>
        <Box gap={2} marginBottom={1}>
          <Text color="#fab387">{item.source}</Text>
          <Text color="#a6e3a1" dimColor>
            {formatRelative(item.pubDate)}
          </Text>
        </Box>
        <Text color="#a6adc8" wrap="wrap">
          {item.description || "(no description)"}
        </Text>
      </Box>
    </Box>
  );
};
