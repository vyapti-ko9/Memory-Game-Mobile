const fs = require("fs");

const appPath = "c:/project-v/memory-game-react/src/App.tsx";
const outPath = "c:/project-v/memory-game-mobile/constants/cardSets.ts";

const s = fs.readFileSync(appPath, "utf8");
const start = s.indexOf("const CARD_SETS");
const end = s.indexOf("const BOARD_CONFIG");
let cardSetsBlock = s.slice(start, end).replace(/\/images\//g, "");
cardSetsBlock = cardSetsBlock.replace("const CARD_SETS", "export const CARD_SETS");

const boardStart = s.indexOf("const BOARD_CONFIG");
const boardEnd = s.indexOf("function getBalancedColumns");
let boardBlock = s.slice(boardStart, boardEnd);
boardBlock = boardBlock.replace("const BOARD_CONFIG", "export const BOARD_CONFIG");

const fnStart = boardEnd;
const fnEnd = s.indexOf("const flipSound");
const fnBlock = s.slice(fnStart, fnEnd).trim();

const header = `export type BoardSize = "small" | "medium" | "large"
export type CardSetKey =
  | "animals"
  | "fruits"
  | "cartoon"
  | "mixed"
  | "custom"
  | "cards"
  | "cars"

`;

const preview = `export const PREVIEW_SETS: Record<Exclude<CardSetKey, "custom">, string> = {
  cards: "cards/a1.png",
  fruits: "fruits/apple.png",
  animals: "animals/elephant.png",
  cartoon: "cartoons/pikachu.png",
  cars: "cars/car.png",
  mixed: "animals/diano.png",
}

export const CARD_SET_ORDER: Exclude<CardSetKey, "custom">[] = [
  "cards",
  "fruits",
  "animals",
  "cartoon",
  "cars",
  "mixed",
]

export const CARD_SET_LABELS: Record<Exclude<CardSetKey, "custom">, string> = {
  cards: "Cards",
  fruits: "Fruits",
  animals: "Animals",
  cartoon: "Cartoon",
  cars: "Cars",
  mixed: "Mixed",
}

`;

const out =
  header +
  cardSetsBlock +
  "\n" +
  boardBlock +
  "\nexport const SMALL_SCREEN_MAX_WIDTH = 420\nexport const LARGE_COMPACT_CONFIG = { cols: 6, pairCount: 21 }\n\n" +
  fnBlock +
  "\n" +
  preview;

fs.writeFileSync(outPath, out);
console.log("Wrote", outPath);
