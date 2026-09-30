// Tipos compartilhados entre telas e API. Mudou aqui? Avise o grupo.

export type Category = "lanches" | "porcoes" | "bebidas" | "sobremesas";

/**
 * Ingrediente personalizável de um produto.
 * included = true  -> vem no lanche; o cliente pode REMOVER (sem custo).
 * included = false -> não vem; o cliente pode ADICIONAR pagando extraPrice.
 */
export interface Ingredient {
  id: string;
  name: string;
  included: boolean;
  extraPrice: number;
}

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  description: string;
  image: string | null; // null = usa o emoji da categoria até termos as fotos
  ingredients: Ingredient[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string; // só no mock! Nunca use senha real.
}

export interface CartItem {
  productId: number;
  name: string;
  unitPrice: number; // já com os extras somados
  quantity: number;
  removedIngredients: string[]; // ids
  addedIngredients: string[]; // ids
}

export type OrderStatus =
  | "recebido"
  | "em_preparo"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export interface ApiErrorBody {
  message: string;
}
