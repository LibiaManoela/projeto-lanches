import type { Category } from "./types";

export const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: "lanches", label: "Lanches", emoji: "🍔" },
  { id: "porcoes", label: "Porções", emoji: "🍟" },
  { id: "bebidas", label: "Bebidas", emoji: "🥤" },
  { id: "sobremesas", label: "Sobremesas", emoji: "🍮" },
];

export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}
