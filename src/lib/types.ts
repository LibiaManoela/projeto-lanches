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
  image: string | null; // null = usa o emoji da categoria como fallback
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
  image?: string | null;
}


export type OrderStatus =
  | "recebido"
  | "em_preparo"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export type PaymentMethod = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro";

/** Campos do formulário de checkout (como o usuário preenche). */
export interface CheckoutFields {
  address: string; // rua e bairro
  number: string; // número ("S/N" se não houver)
  complement: string; // opcional
  zipCode: string; // "00000-000"
  phone: string; // telefone brasileiro com DDD
  notes: string; // opcional
  paymentMethod: PaymentMethod | ""; // "" = ainda não escolhida
}

/** Pedido registrado pela API. Nome, preço e total são calculados no servidor. */
export interface Order {
  id: number;
  userId: number;
  createdAt: string; // ISO 8601
  status: OrderStatus;
  items: CartItem[];
  total: number;
  address: string;
  number: string;
  complement: string;
  zipCode: string; // "00000-000"
  phone: string; // só dígitos, com DDD
  notes: string;
  paymentMethod: PaymentMethod;
}

export interface ApiErrorBody {
  message: string;
}
