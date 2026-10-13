import type { PaymentMethod } from "./types";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Cartão de crédito" },
  { id: "cartao_debito", label: "Cartão de débito" },
  { id: "dinheiro", label: "Dinheiro" },
];

export function paymentMethodById(id: string) {
  return PAYMENT_METHODS.find((method) => method.id === id);
}
