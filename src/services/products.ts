import type { Product } from "@/lib/types";
import { request } from "./api";

interface GetProductsParams {
  category?: string;
  q?: string;
  simular?: string; // "erro" -> a API responde 500 (para demonstrar o tratamento de erro)
}

export function getProducts(params: GetProductsParams = {}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.simular) search.set("simular", params.simular);
  return request<Product[]>(`/api/products?${search.toString()}`, { signal });
}
