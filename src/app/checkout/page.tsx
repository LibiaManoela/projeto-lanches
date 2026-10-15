"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { formatBRL } from "@/lib/format";
import { cartTotal, describeItemChanges, lineTotal } from "@/lib/orders";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import type { CheckoutFields, PaymentMethod } from "@/lib/types";
import { formatCep, formatPhone, LIMITS, validateCheckout } from "@/lib/validators";
import { ApiError } from "@/services/api";
import { clearSession, getSession, type SessionUser } from "@/services/auth";
import { createOrder } from "@/services/orders";
import { useCart } from "@/store/carrinho";

type Field = keyof CheckoutFields;

// Ordem em que os campos aparecem na tela (usada para focar o primeiro erro).
const FIELD_ORDER: Field[] = ["address", "number", "complement", "zipCode", "phone", "paymentMethod", "notes"];

const FIELD_LABEL: Record<Field, string> = {
  address: "Endereço",
  number: "Número",
  complement: "Complemento",
  zipCode: "CEP",
  phone: "Telefone",
  paymentMethod: "Forma de pagamento",
  notes: "Observações",
};

const EMPTY_VALUES: CheckoutFields = {
  address: "",
  number: "",
  complement: "",
  zipCode: "",
  phone: "",
  notes: "",
  paymentMethod: "",
};

const cardClass = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-laranja-claro sm:p-6";

function inputClass(hasError: boolean) {
  return `min-h-12 w-full rounded-md bg-white px-4 ${
    hasError ? "border-2 border-laranja-escuro" : "border border-cinza"
  }`;
}

// Chave que identifica esta tentativa de pedido: se o envio for repetido
// (duplo clique, nova tentativa após falha de rede), a API devolve o mesmo pedido.
function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function focusField(field: Field) {
  document.getElementById(`checkout-${field}`)?.focus();
}

interface FieldBlockProps {
  field: Field;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldBlock({ field, label, optional, error, hint, children }: FieldBlockProps) {
  return (
    <div>
      <label htmlFor={`checkout-${field}`} className="mb-1 block font-medium">
        {label}
        {optional ? <span className="font-normal text-cinza"> (opcional)</span> : <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`checkout-${field}-hint`} className="mt-1 text-sm text-cinza">
          {hint}
        </p>
      )}
      {error && (
        <p id={`checkout-${field}-error`} className="mt-1 text-sm font-medium text-laranja-escuro">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false); // sessão já conferida no navegador
  const [values, setValues] = useState<CheckoutFields>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false); // pedido criado, redirecionando
  const [formError, setFormError] = useState("");
  const [formErrorCode, setFormErrorCode] = useState(0);

  const submittingRef = useRef(false);
  const keyRef = useRef<string>("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
    keyRef.current = newIdempotencyKey();
    setReady(true);
  }, [router]);

  const errors = useMemo(() => validateCheckout(values), [values]);
  const errorFields = FIELD_ORDER.filter((field) => errors[field]);
  const total = cartTotal(items);
  const busy = submitting || done;

  // Só mostra o erro de um campo depois que o usuário passou por ele (ou tentou enviar).
  function visibleError(field: Field) {
    return touched[field] || submitted ? errors[field] : undefined;
  }

  function setField<K extends Field>(field: K, value: CheckoutFields[K]) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setFormError("");
  }

  function touch(field: Field) {
    setTouched((previous) => (previous[field] ? previous : { ...previous, [field]: true }));
  }

  function describedBy(field: Field, hasHint: boolean) {
    if (visibleError(field)) return `checkout-${field}-error`;
    return hasHint ? `checkout-${field}-hint` : undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || done) return;

    setSubmitted(true);
    setFormError("");

    const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }
    if (!user || items.length === 0) return;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const order = await createOrder(
        user.id,
        {
          address: values.address.trim(),
          number: values.number.trim(),
          complement: values.complement.trim(),
          zipCode: values.zipCode,
          phone: values.phone,
          notes: values.notes.trim(),
          paymentMethod: values.paymentMethod as PaymentMethod,
          // O servidor recalcula nome, preço e total a partir do cardápio.
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            removedIngredients: item.removedIngredients,
            addedIngredients: item.addedIngredients,
          })),
        },
        keyRef.current,
      );
      setDone(true);
      clearCart();
      router.replace(`/pedido/${order.id}?confirmado=1`);
    } catch (error) {
      // O servidor não reconhece mais este usuário (ex.: foi reiniciado e a conta de teste sumiu).
      // Limpa a sessão local para que a tela de login não redirecione de volta ao cardápio.
      if (error instanceof ApiError && error.status === 401) clearSession();
      setFormError(error instanceof ApiError ? error.message : "Não foi possível finalizar o pedido. Tente novamente.");
      setFormErrorCode(error instanceof ApiError ? error.status : 0);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const numberIsSN = values.number.trim().toUpperCase() === "S/N";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Header showBackToCardapio />

      <h1 className="text-[28px] font-bold">Finalizar pedido</h1>

      {!ready && (
        <p className="mt-4" role="status">
          Carregando...
        </p>
      )}

      {ready && items.length === 0 && !done && (
        <section aria-label="Carrinho vazio" className={`mt-6 text-center ${cardClass}`}>
          <span aria-hidden="true" className="text-5xl">🛒</span>
          <h2 className="mt-3 text-xl font-bold">Seu carrinho está vazio</h2>
          <p className="mt-2 text-cinza">Adicione itens do cardápio para finalizar um pedido.</p>
          <Link
            href="/cardapio"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-laranja-escuro px-6 text-[15px] font-medium text-white transition-colors hover:bg-marrom"
          >
            Ver cardápio
          </Link>
        </section>
      )}

      {ready && (items.length > 0 || done) && (
        <form noValidate onSubmit={handleSubmit} className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {submitted && errorFields.length > 0 && (
              <div role="alert" className="rounded-2xl bg-laranja-claro p-5">
                <p className="font-semibold">
                  {errorFields.length === 1
                    ? "Corrija 1 campo para continuar:"
                    : `Corrija ${errorFields.length} campos para continuar:`}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errorFields.map((field) => (
                    <li key={field}>
                      <a
                        href={`#checkout-${field}`}
                        onClick={(event) => {
                          event.preventDefault();
                          focusField(field);
                        }}
                        className="font-medium underline underline-offset-2"
                      >
                        {FIELD_LABEL[field]}
                      </a>
                      : {errors[field]}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <section aria-labelledby="entrega-titulo" className={cardClass}>
              <h2 id="entrega-titulo" className="font-poppins text-lg font-semibold">
                Entrega
              </h2>
              <p className="mt-1 text-sm text-cinza">Campos com * são obrigatórios.</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <FieldBlock field="address" label="Endereço (rua e bairro)" error={visibleError("address")}>
                    <input
                      id="checkout-address"
                      name="address"
                      autoComplete="address-line1"
                      aria-required="true"
                      aria-invalid={visibleError("address") ? true : undefined}
                      aria-describedby={describedBy("address", false)}
                      value={values.address}
                      onChange={(event) => setField("address", event.target.value)}
                      onBlur={() => touch("address")}
                      disabled={busy}
                      className={inputClass(!!visibleError("address"))}
                    />
                  </FieldBlock>
                </div>

                <div className="sm:col-span-2">
                  <FieldBlock field="number" label="Número" error={visibleError("number")}>
                    <input
                      id="checkout-number"
                      name="number"
                      autoComplete="address-line2"
                      aria-required="true"
                      aria-invalid={visibleError("number") ? true : undefined}
                      aria-describedby={describedBy("number", false)}
                      value={values.number}
                      onChange={(event) => setField("number", event.target.value)}
                      onBlur={() => touch("number")}
                      disabled={busy}
                      className={inputClass(!!visibleError("number"))}
                    />
                  </FieldBlock>
                  <label className="mt-2 flex min-h-8 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={numberIsSN}
                      disabled={busy}
                      onChange={(event) => {
                        setField("number", event.target.checked ? "S/N" : "");
                        touch("number");
                      }}
                      className="size-5 accent-laranja-escuro"
                    />
                    Sem número (S/N)
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <FieldBlock field="complement" label="Complemento" optional error={visibleError("complement")}>
                    <input
                      id="checkout-complement"
                      name="complement"
                      autoComplete="off"
                      aria-invalid={visibleError("complement") ? true : undefined}
                      aria-describedby={describedBy("complement", false)}
                      value={values.complement}
                      onChange={(event) => setField("complement", event.target.value)}
                      onBlur={() => touch("complement")}
                      disabled={busy}
                      className={inputClass(!!visibleError("complement"))}
                    />
                  </FieldBlock>
                </div>

                <div className="sm:col-span-3">
                  <FieldBlock field="zipCode" label="CEP" error={visibleError("zipCode")} hint="Ex.: 90000-000">
                    <input
                      id="checkout-zipCode"
                      name="zipCode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      aria-required="true"
                      aria-invalid={visibleError("zipCode") ? true : undefined}
                      aria-describedby={describedBy("zipCode", true)}
                      value={values.zipCode}
                      onChange={(event) => setField("zipCode", formatCep(event.target.value))}
                      onBlur={() => touch("zipCode")}
                      disabled={busy}
                      className={inputClass(!!visibleError("zipCode"))}
                    />
                  </FieldBlock>
                </div>

                <div className="sm:col-span-6">
                  <FieldBlock field="phone" label="Telefone com DDD" error={visibleError("phone")} hint="Ex.: (51) 91234-5678">
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      aria-required="true"
                      aria-invalid={visibleError("phone") ? true : undefined}
                      aria-describedby={describedBy("phone", true)}
                      value={values.phone}
                      onChange={(event) => setField("phone", formatPhone(event.target.value))}
                      onBlur={() => touch("phone")}
                      disabled={busy}
                      className={inputClass(!!visibleError("phone"))}
                    />
                  </FieldBlock>
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <fieldset
                aria-describedby={visibleError("paymentMethod") ? "checkout-paymentMethod-error" : undefined}
                disabled={busy}
              >
                <legend className="font-poppins text-lg font-semibold">
                  Forma de pagamento<span aria-hidden="true"> *</span>
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method, index) => (
                    <label
                      key={method.id}
                      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 ring-1 has-[:checked]:bg-amarelo-claro has-[:checked]:ring-2 has-[:checked]:ring-marrom ${
                        visibleError("paymentMethod") ? "ring-2 ring-laranja-escuro" : "ring-cinza"
                      }`}
                    >
                      <input
                        // O primeiro botão recebe o id para o foco quando a escolha estiver faltando.
                        id={index === 0 ? "checkout-paymentMethod" : undefined}
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={values.paymentMethod === method.id}
                        onChange={() => {
                          setField("paymentMethod", method.id);
                          touch("paymentMethod");
                        }}
                        className="size-5 accent-laranja-escuro"
                      />
                      <span className="font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {visibleError("paymentMethod") && (
                <p id="checkout-paymentMethod-error" className="mt-2 text-sm font-medium text-laranja-escuro">
                  {visibleError("paymentMethod")}
                </p>
              )}
            </section>

            <section className={cardClass}>
              <FieldBlock
                field="notes"
                label="Observações para o pedido"
                optional
                error={visibleError("notes")}
              >
                <textarea
                  id="checkout-notes"
                  name="notes"
                  rows={3}
                  aria-invalid={visibleError("notes") ? true : undefined}
                  aria-describedby={`${visibleError("notes") ? "checkout-notes-error " : ""}checkout-notes-count`}
                  value={values.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  onBlur={() => touch("notes")}
                  disabled={busy}
                  className={`${inputClass(!!visibleError("notes"))} py-3`}
                />
              </FieldBlock>
              <p
                id="checkout-notes-count"
                className={`mt-1 text-right text-sm ${values.notes.trim().length > LIMITS.notes ? "font-medium text-laranja-escuro" : "text-cinza"}`}
              >
                {values.notes.trim().length}/{LIMITS.notes}
              </p>
            </section>
          </div>

          <aside aria-labelledby="resumo-titulo" className={`${cardClass} lg:sticky lg:top-6`}>
            <h2 id="resumo-titulo" className="font-poppins text-lg font-semibold">
              Resumo do pedido
            </h2>
            <ul className="mt-3 divide-y divide-laranja-claro">
              {items.map((item, index) => {
                const changes = describeItemChanges(item);
                return (
                  <li key={`${item.productId}-${index}`} className="flex justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {item.quantity}x {item.name}
                      </p>
                      {changes.length > 0 && <p className="text-cinza">{changes.join(", ")}</p>}
                    </div>
                    <p className="shrink-0 font-medium">{formatBRL(lineTotal(item))}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 flex items-baseline justify-between border-t border-laranja-claro pt-4 text-lg font-bold">
              <span>Total</span>
              <span className="text-laranja-escuro">{formatBRL(total)}</span>
            </p>

            {formError && (
              <div role="alert" className="mt-4 rounded-md bg-laranja-claro p-3 text-sm">
                <p className="font-medium">{formError}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {formErrorCode === 401 && (
                    <Link href="/login" className="font-medium underline underline-offset-2">
                      Entrar novamente
                    </Link>
                  )}
                  {formErrorCode === 422 && (
                    <Link href="/carrinho" className="font-medium underline underline-offset-2">
                      Revisar carrinho
                    </Link>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-5 min-h-12 w-full rounded-full bg-laranja-escuro px-5 text-base font-bold text-white shadow-md transition-colors hover:bg-marrom disabled:cursor-wait disabled:opacity-70"
            >
              {done ? "Pedido realizado!" : submitting ? "Enviando pedido..." : "Finalizar pedido"}
            </button>
            <Link
              href="/carrinho"
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-branco-suave px-4 text-sm font-semibold ring-1 ring-laranja-claro transition-colors hover:bg-amarelo-claro"
            >
              Voltar ao carrinho
            </Link>
          </aside>
        </form>
      )}
    </div>
  );
}