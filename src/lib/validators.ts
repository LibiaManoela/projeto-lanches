import { PAYMENT_METHODS } from "./payment-methods";
import type { CheckoutFields } from "./types";

// Validações do checkout. São usadas na tela E na API (o servidor nunca confia só no frontend).

export type CheckoutErrors = Partial<Record<keyof CheckoutFields, string>>;

export const LIMITS = { address: 120, number: 10, complement: 60, notes: 300 } as const;

const VALID_DDD = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38", "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55", "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79", "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Máscara do CEP: 00000-000 */
export function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** Telefone só com dígitos (DDD + número). Aceita o prefixo +55. */
export function normalizePhone(value: string) {
  let digits = onlyDigits(value);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return digits;
}

/** Máscara do telefone: (11) 91234-5678 ou (11) 2345-6789 */
export function formatPhone(value: string) {
  const raw = value.trim();
  let digits = onlyDigits(raw);
  // O 55 só é tratado como código do país quando o usuário digita/cola "+55"
  // (55 também é um DDD válido do Rio Grande do Sul).
  if (raw.startsWith("+")) {
    // Digitando "+", "+5": mantém o prefixo para não confundir o 55 com o DDD.
    if (digits.length < 2 && "55".startsWith(digits)) return `+${digits}`;
    // "+55" completo: o código do país some e o que vier depois é o número nacional.
    if (digits.startsWith("55")) digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (digits.length <= 6) return `(${ddd}) ${rest}`;
  if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function validateCep(value: string) {
  const cep = value.trim();
  if (!cep) return "Informe o CEP.";
  if (!/^\d{5}-?\d{3}$/.test(cep) || onlyDigits(cep) === "00000000") {
    return "CEP inválido. Use o formato 00000-000.";
  }
  return "";
}

export function validatePhone(value: string) {
  if (!value.trim()) return "Informe o telefone.";
  const digits = normalizePhone(value);
  if (digits.length !== 10 && digits.length !== 11) {
    return "Telefone inválido. Informe o DDD e o número, ex.: (11) 91234-5678.";
  }
  if (!VALID_DDD.has(digits.slice(0, 2))) return "DDD inválido.";
  if (digits.length === 11 && digits[2] !== "9") return "Celular inválido: o número deve começar com 9.";
  if (digits.length === 10 && !/[2-5]/.test(digits[2])) return "Telefone fixo inválido.";
  return "";
}

export function validateField(field: keyof CheckoutFields, values: CheckoutFields): string {
  switch (field) {
    case "address": {
      const address = values.address.trim();
      if (!address) return "Informe o endereço de entrega.";
      if (address.length < 3) return "Informe o endereço completo.";
      if (address.length > LIMITS.address) return `Use no máximo ${LIMITS.address} caracteres.`;
      return "";
    }
    case "number": {
      const number = values.number.trim();
      if (!number) return "Informe o número ou S/N.";
      if (number.length > LIMITS.number) return `Use no máximo ${LIMITS.number} caracteres.`;
      return "";
    }
    case "complement":
      return values.complement.trim().length > LIMITS.complement
        ? `Use no máximo ${LIMITS.complement} caracteres.`
        : "";
    case "zipCode":
      return validateCep(values.zipCode);
    case "phone":
      return validatePhone(values.phone);
    case "notes":
      return values.notes.trim().length > LIMITS.notes
        ? `Use no máximo ${LIMITS.notes} caracteres.`
        : "";
    case "paymentMethod":
      return PAYMENT_METHODS.some((method) => method.id === values.paymentMethod)
        ? ""
        : "Selecione a forma de pagamento.";
  }
}

export function validateCheckout(values: CheckoutFields): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of Object.keys(values) as (keyof CheckoutFields)[]) {
    const message = validateField(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}
