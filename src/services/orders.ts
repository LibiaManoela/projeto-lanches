import type { CartItem, CheckoutFields, Order, PaymentMethod } from "@/lib/types";
import { request } from "./api";

// Só o necessário para identificar o item: nome, preço e total são calculados no servidor.
export interface CreateOrderPayload extends Omit<CheckoutFields, "paymentMethod"> {
  paymentMethod: PaymentMethod;
  items: Pick<CartItem, "productId" | "quantity" | "removedIngredients" | "addedIngredients">[];
}

export function createOrder(userId: number, payload: CreateOrderPayload, idempotencyKey: string) {
  return request<Order>("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": String(userId),
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

interface GetOrderParams {
  simular?: string; // "erro" -> a API responde 500 (para demonstrar o tratamento de erro)
}

export function getOrder(userId: number, id: string, params: GetOrderParams = {}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.simular) search.set("simular", params.simular);
  const query = search.toString();
  return request<Order>(`/api/orders/${encodeURIComponent(id)}${query ? `?${query}` : ""}`, {
    headers: { "X-User-Id": String(userId) },
    cache: "no-store", // o status muda: nunca reaproveitar resposta antiga
    signal,
  });
}
