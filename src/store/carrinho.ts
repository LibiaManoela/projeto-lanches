"use client";

import { useSyncExternalStore } from "react";
import type { CartItem } from "@/lib/types";

const CART_STORAGE_KEY = "projeto-lanches-carrinho";

// Evento customizado para disparar re-render no React quando o carrinho muda
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function areListsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Falha ao salvar carrinho no localStorage", e);
  }
  emitChange();
}

export function addToCart(newItem: CartItem) {
  const current = getCart();

  // Verifica se já existe o mesmo produto com as MESMAS personalizações
  const existingIndex = current.findIndex(
    (item) =>
      item.productId === newItem.productId &&
      item.unitPrice === newItem.unitPrice &&
      areListsEqual(item.removedIngredients, newItem.removedIngredients) &&
      areListsEqual(item.addedIngredients, newItem.addedIngredients)
  );

  if (existingIndex >= 0) {
    current[existingIndex].quantity += newItem.quantity;
  } else {
    current.push(newItem);
  }

  saveCart(current);
}

export function removeFromCart(index: number) {
  const current = getCart();
  if (index >= 0 && index < current.length) {
    current.splice(index, 1);
    saveCart(current);
  }
}

export function updateCartQuantity(index: number, quantity: number) {
  const current = getCart();
  if (index >= 0 && index < current.length) {
    if (quantity <= 0) {
      current.splice(index, 1);
    } else {
      current[index].quantity = quantity;
    }
    saveCart(current);
  }
}

export function clearCart() {
  saveCart([]);
}

// Hook de sincronização para React components
let cachedSnapshot: CartItem[] = [];
let rawSnapshotString = "";

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === CART_STORAGE_KEY) {
      emitChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): CartItem[] {
  if (typeof window === "undefined") return [];
  const currentRaw = localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
  if (currentRaw !== rawSnapshotString) {
    rawSnapshotString = currentRaw;
    try {
      cachedSnapshot = JSON.parse(currentRaw);
    } catch {
      cachedSnapshot = [];
    }
  }
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return SERVER_SNAPSHOT;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return {
    items,
    totalCount,
    subtotal,
    addItem: addToCart,
    removeItem: removeFromCart,
    updateQuantity: updateCartQuantity,
    clearCart,
  };
}
