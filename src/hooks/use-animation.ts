import { useState } from "react";
import { useInterval } from "./use-interval.js";

type AnimationOptions = number | { intervalMs: number };

export const useAnimation = (options: AnimationOptions): number => {
  const [frame, setFrame] = useState(0);
  const delay =
    typeof options === "number" ? Math.floor(1000 / options) : options.intervalMs;

  useInterval(() => {
    setFrame((f) => f + 1);
  }, delay);

  return frame;
};
