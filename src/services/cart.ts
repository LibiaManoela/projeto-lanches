import type { CartItem } from "@/lib/types";

// Carrinho guardado no navegador, como a sessão (services/auth.ts).
// A tela do carrinho deve gravar aqui com saveCart(); o checkout lê com getCart().
const CART_KEY = "Aplicativo-cart";

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isInteger(item.productId) &&
    typeof item.name === "string" &&
    typeof item.unitPrice === "number" &&
    Number.isInteger(item.quantity) && (item.quantity as number) > 0 &&
    Array.isArray(item.removedIngredients) &&
    Array.isArray(item.addedIngredients)
  );
}

export function getCart(): CartItem[] {
  const stored = sessionStorage.getItem(CART_KEY);
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    sessionStorage.removeItem(CART_KEY);
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
  sessionStorage.removeItem(CART_KEY);
}
