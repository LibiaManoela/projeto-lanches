import type { CartItem, OrderStatus } from "./types";

// Apresentação e regras dos status do pedido, compartilhadas entre tela e API.

export const ORDER_STATUS: Record<OrderStatus, { label: string; description: string; badge: string }> = {
  recebido: {
    label: "Pedido recebido",
    description: "Recebemos o seu pedido.",
    badge: "bg-amarelo-claro text-marrom",
  },
  em_preparo: {
    label: "Em preparação",
    description: "Seu pedido está sendo preparado.",
    badge: "bg-amarelo text-marrom",
  },
  saiu_para_entrega: {
    label: "Saiu para entrega",
    description: "Seu pedido está a caminho do endereço informado.",
    badge: "bg-laranja-claro text-marrom",
  },
  entregue: {
    label: "Entregue",
    description: "Seu pedido foi entregue. Bom apetite!",
    badge: "bg-marrom text-white",
  },
  cancelado: {
    label: "Cancelado",
    description: "Este pedido foi cancelado.",
    badge: "bg-laranja-claro text-marrom",
  },
};

/** Etapas em ordem (o cancelamento não faz parte da sequência). */
export const STATUS_STEPS: { id: OrderStatus; label: string }[] = [
  { id: "recebido", label: "Recebido" },
  { id: "em_preparo", label: "Em preparo" },
  { id: "saiu_para_entrega", label: "Saiu para entrega" },
  { id: "entregue", label: "Entregue" },
];

/** Mudanças de status aceitas pela API. */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  recebido: ["em_preparo", "cancelado"],
  em_preparo: ["saiu_para_entrega", "cancelado"],
  saiu_para_entrega: ["entregue"],
  entregue: [],
  cancelado: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && Object.hasOwn(ORDER_STATUS, value);
}

export function isFinalStatus(status: OrderStatus) {
  return STATUS_TRANSITIONS[status]?.length === 0;
}

// Valores em centavos para não acumular erro de ponto flutuante.
export function lineTotal(item: Pick<CartItem, "unitPrice" | "quantity">) {
  return (Math.round(item.unitPrice * 100) * item.quantity) / 100;
}

export function cartTotal(items: Pick<CartItem, "unitPrice" | "quantity">[]) {
  return items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0) / 100;
}

function ingredientName(id: string) {
  return id.replace(/-/g, " ");
}

/** Ex.: ["Sem alface", "Extra bacon"] */
export function describeItemChanges(item: Pick<CartItem, "removedIngredients" | "addedIngredients">) {
  return [
    ...item.removedIngredients.map((id) => `Sem ${ingredientName(id)}`),
    ...item.addedIngredients.map((id) => `Extra ${ingredientName(id)}`),
  ];
}

export function formatOrderDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
