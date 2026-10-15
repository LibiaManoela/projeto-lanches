import type { Order, OrderStatus } from "@/lib/types";
import { findUserById } from "@/lib/mock-users";

// Pedidos ficam só na memória do servidor (como as contas de mock-users.ts):
// somem quando o servidor reinicia.
const globalOrders = globalThis as typeof globalThis & {
  AplicativoOrders?: Order[];
  AplicativoOrderKeys?: Map<string, number>;
};
const orders = globalOrders.AplicativoOrders ?? (globalOrders.AplicativoOrders = []);
// Chave de idempotência -> id do pedido (evita pedido duplicado em cliques/reenvios).
const orderKeys = globalOrders.AplicativoOrderKeys ?? (globalOrders.AplicativoOrderKeys = new Map());

/**
 * Usuário da requisição, vindo do cabeçalho X-User-Id.
 * Atenção: o login do projeto é simulado (sem token/cookie de servidor), então isto
 * identifica o usuário mas NÃO é autenticação de verdade.
 */
export function getRequestUserId(request: Request) {
  const value = request.headers.get("x-user-id") ?? "";
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return findUserById(id) ? id : null;
}

export function findOrderById(id: number) {
  return orders.find((order) => order.id === id);
}

export function findOrdersByUserId(userId: number) {
  return orders
    .filter((order) => order.userId === userId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

const DEMO_STATUS_STEP_MS = 15_000;
const DEMO_STATUS_STEPS: OrderStatus[] = [
  "recebido",
  "em_preparo",
  "saiu_para_entrega",
  "entregue",
];

export function advanceDemoOrderStatus(order: Order, now = Date.now()) {
  if (order.status === "cancelado" || order.status === "entregue") return order;

  const elapsed = now - new Date(order.createdAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return order;

  const targetIndex = Math.min(
    Math.floor(elapsed / DEMO_STATUS_STEP_MS),
    DEMO_STATUS_STEPS.length - 1,
  );
  const currentIndex = DEMO_STATUS_STEPS.indexOf(order.status);
  if (targetIndex > currentIndex) order.status = DEMO_STATUS_STEPS[targetIndex];

  return order;
}

export function findOrderByKey(userId: number, key: string) {
  const id = orderKeys.get(`${userId}:${key}`);
  return id === undefined ? undefined : findOrderById(id);
}

export function addOrder(data: Omit<Order, "id" | "createdAt" | "status">, key?: string) {
  const order: Order = {
    ...data,
    id: Math.max(0, ...orders.map((existingOrder) => existingOrder.id)) + 1,
    createdAt: new Date().toISOString(),
    status: "recebido",
  };
  orders.push(order);
  if (key) orderKeys.set(`${data.userId}:${key}`, order.id);
  return order;
}

export function updateOrderStatus(order: Order, status: OrderStatus) {
  order.status = status;
  return order;
}
