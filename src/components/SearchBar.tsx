import { Box, Text } from "ink";
import React from "react";
import { TextInput } from "@/components/ui/text-input.js";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <Box paddingX={1} gap={1}>
    <Text color="#cba6f7" bold>
      /
    </Text>
    <TextInput
      value={value}
      onChange={onChange}
      placeholder="search articles..."
      bordered={false}
      autoFocus
      width={60}
    />
  </Box>
);
