/** Mirrors `memory-game-react/src/index.css` game / modal tokens */

export const gameShell = {
  topGlow: ["rgba(56, 189, 248, 0.14)", "rgba(56, 189, 248, 0)", "transparent"] as const,
  base: ["#0a1a32", "#061018"] as const,
}

export const topBar = {
  light: ["rgba(12, 45, 92, 0.94)", "rgba(8, 30, 62, 0.98)"] as const,
  dark: ["rgba(15, 23, 42, 0.96)", "rgba(3, 7, 18, 0.99)"] as const,
}

export const playArea = {
  light: ["#0c2d5c", "#082449", "#061830"] as const,
  dark: ["#0f172a", "#020617"] as const,
}

export const iconBtnGradient = ["#38bdf8", "#259add", "#1d7fc4"] as const

export const progressTrack = {
  border: "rgba(56, 189, 248, 0.35)",
  track: "rgba(0, 0, 0, 0.25)",
}

export const progressFill = ["#22d3ee", "#38bdf8", "#0ea5e9"] as const

export const modalCard = {
  glow: ["rgba(56, 189, 248, 0.22)", "transparent"] as const,
  base: ["rgba(12, 45, 92, 0.97)", "rgba(8, 28, 56, 0.99)"] as const,
}

export const startScreen = {
  base: ["#061228", "#081a35", "#0a2244"] as const,
}
