"use client";

import { useEffect, useRef, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { categoryById } from "@/lib/categories";
import { formatBRL } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ApiError } from "@/services/api";
import { getProduct } from "@/services/products";
import { useCart } from "@/store/carrinho";

type PageStatus = "loading" | "ok" | "error" | "not_found";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProdutoDetalhesPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { addItem } = useCart();

  // Estados do carregamento do produto
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  // Estados de personalização
  const [quantity, setQuantity] = useState(1);
  const [removedIngredientIds, setRemovedIngredientIds] = useState<string[]>([]);
  const [addedIngredientIds, setAddedIngredientIds] = useState<string[]>([]);

  // Feedback de adição ao carrinho
  const [showAddedModal, setShowAddedModal] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (showAddedModal && !dialog.open) dialog.showModal();
    if (!showAddedModal && dialog.open) dialog.close();
  }, [showAddedModal]);

  // Busca dos dados do produto via service
  useEffect(() => {
    const controller = new AbortController();
    const simular = searchParams.get("simular") ?? undefined;

    setStatus("loading");
    setProduct(null);

    getProduct(productId, { simular }, controller.signal)
      .then((data) => {
        setProduct(data);
        setStatus("ok");
        // Reinicia seleções de personalização para o novo produto
        setQuantity(1);
        setRemovedIngredientIds([]);
        setAddedIngredientIds([]);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (error instanceof ApiError && error.status === 404) {
          setStatus("not_found");
          setErrorMessage(error.message || "Produto não encontrado.");
        } else {
          setStatus("error");
          setErrorMessage(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar os detalhes do produto. Verifique sua conexão e tente novamente."
          );
        }
      });

    return () => {
      controller.abort();
    };
  }, [productId, searchParams, attempt]);

  // Separação dos ingredientes em inclusos (podem ser removidos) e adicionais (podem ser incluídos)
  const defaultIngredients = product?.ingredients.filter((i) => i.included) ?? [];
  const extraIngredients = product?.ingredients.filter((i) => !i.included) ?? [];

  // Cálculo de valores dinâmicos
  const extrasUnitPrice = extraIngredients
    .filter((extra) => addedIngredientIds.includes(extra.id))
    .reduce((sum, extra) => sum + extra.extraPrice, 0);

  const unitPrice = (product?.price ?? 0) + extrasUnitPrice;
  const totalPrice = unitPrice * quantity;

  // Manipuladores de personalização
  function toggleIncludedIngredient(id: string) {
    setRemovedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleExtraIngredient(id: string) {
    setAddedIngredientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleDecreaseQuantity() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function handleIncreaseQuantity() {
    setQuantity((q) => Math.min(99, q + 1));
  }

  function handleAddToCart() {
    if (!product) return;

    addItem({
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity,
      removedIngredients: removedIngredientIds,
      addedIngredients: addedIngredientIds,
      image: product.image,
    });

    setShowAddedModal(true);
  }

  function handleRetry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  const category = product ? categoryById(product.category) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Header showBackToCardapio={true} />

      {/* Região viva para leitura de status por leitores de tela */}
      <div className="sr-only" aria-live="polite">
        {status === "loading" && "Carregando detalhes do produto..."}
        {status === "ok" && product && `Exibindo detalhes de ${product.name}`}
      </div>

      {/* ESTADO: CARREGANDO */}
      {status === "loading" && (
        <section
          aria-label="Carregando informações do produto"
          className="mx-auto max-w-4xl animate-pulse"
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-72 w-full rounded-3xl bg-laranja-claro/40 md:h-96" />
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="h-6 w-24 rounded-full bg-laranja-claro/50" />
                <div className="mt-3 h-8 w-3/4 rounded-lg bg-laranja-claro/60" />
                <div className="mt-4 h-16 w-full rounded-lg bg-laranja-claro/30" />
                <div className="mt-6 h-7 w-28 rounded-lg bg-laranja-claro/60" />
              </div>
              <div className="h-28 w-full rounded-2xl bg-laranja-claro/30" />
              <div className="h-14 w-full rounded-full bg-laranja-claro/50" />
            </div>
          </div>
        </section>
      )}

      {/* ESTADO: ERRO */}
      {status === "error" && (
        <section
          role="alert"
          aria-labelledby="titulo-erro"
          className="mx-auto max-w-xl rounded-3xl border border-coral/30 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">⚠️</span>
            <h1 id="titulo-erro" className="text-xl font-bold text-marrom">
              Não foi possível carregar o produto
            </h1>
          </div>
          <p className="mt-3 text-cinza">{errorMessage}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-11 rounded-full bg-laranja-escuro px-6 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-marrom focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marrom"
            >
              Tentar novamente
            </button>
            <Link
              href="/cardapio"
              className="inline-flex min-h-11 items-center rounded-full bg-laranja-claro px-6 text-[15px] font-medium text-marrom transition-colors hover:bg-amarelo-claro"
            >
              Voltar ao cardápio
            </Link>
          </div>
        </section>
      )}

      {/* ESTADO: NÃO ENCONTRADO (404) */}
      {status === "not_found" && (
        <section
          role="region"
          aria-labelledby="titulo-404"
          className="mx-auto max-w-xl text-center rounded-3xl bg-white p-8 shadow-sm ring-1 ring-laranja-claro"
        >
          <span aria-hidden="true" className="text-5xl">🔍</span>
          <h1 id="titulo-404" className="mt-3 text-2xl font-bold text-marrom">
            Produto não encontrado
          </h1>
          <p className="mt-2 text-cinza">
            O item que você está procurando não existe ou foi removido do nosso cardápio.
          </p>
          <div className="mt-6">
            <Link
              href="/cardapio"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-laranja-escuro px-6 text-[15px] font-medium text-white shadow-sm hover:bg-marrom"
            >
              Explorar outros lanches
            </Link>
          </div>
        </section>
      )}

      {/* ESTADO: SUCESSO (EXIBIÇÃO E PERSONALIZAÇÃO DO PRODUTO) */}
      {status === "ok" && product && (
        <article className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-start">
            {/* Coluna da Imagem */}
            <div className="relative flex min-h-72 w-full items-center justify-center overflow-hidden rounded-3xl bg-amarelo-claro shadow-sm ring-1 ring-laranja-claro md:min-h-96">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  unoptimized={process.env.NODE_ENV === "development"}
                  sizes="(min-width: 1024px) 500px, 100vw"
                  className="object-cover"
                />
              ) : (
                <span aria-hidden="true" className="text-8xl">
                  {category?.emoji ?? "🍔"}
                </span>
              )}
              {category && (
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3.5 py-1 text-sm font-semibold uppercase tracking-wider text-marrom backdrop-blur-sm shadow-sm ring-1 ring-laranja-claro">
                  {category.emoji} {category.label}
                </div>
              )}
            </div>

            {/* Coluna de Informações e Ações */}
            <div className="flex flex-col">
              <h1 className="font-poppins text-2xl font-bold tracking-tight text-marrom sm:text-3xl">
                {product.name}
              </h1>

              <p className="mt-2 text-base leading-relaxed text-cinza">
                {product.description}
              </p>

              {/* Preço base */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-sm font-medium text-cinza">Preço base:</span>
                <span className="text-2xl font-bold text-laranja-escuro">
                  {formatBRL(product.price)}
                </span>
              </div>

              {/* SEÇÃO DE PERSONALIZAÇÃO */}
              <div className="mt-6 border-t border-laranja-claro pt-6">
                <h2 className="text-lg font-bold text-marrom">
                  Personalize seu pedido
                </h2>

                {/* Caso 1: Ingredientes padrão (Remoção sem custo) */}
                {defaultIngredients.length > 0 && (
                  <fieldset className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-laranja-claro">
                    <legend className="px-1 text-sm font-semibold text-marrom">
                      Ingredientes inclusos (desmarque para remover)
                    </legend>
                    <p className="mt-1 text-sm text-cinza">
                      Prefere sem algum ingrediente? Desmarque as opções que não deseja:
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {defaultIngredients.map((ingredient) => {
                        const isRemoved = removedIngredientIds.includes(ingredient.id);
                        return (
                          <label
                            key={ingredient.id}
                            className={`flex min-h-11 cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 transition-colors ${
                              isRemoved
                                ? "bg-laranja-claro/40 text-cinza"
                                : "bg-branco-suave text-marrom hover:bg-amarelo-claro/50"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!isRemoved}
                                onChange={() => toggleIncludedIngredient(ingredient.id)}
                                className="h-5 w-5 rounded border-cinza text-laranja-escuro focus:ring-marrom"
                              />
                              <span className={`text-sm font-medium ${isRemoved ? "line-through" : ""}`}>
                                {ingredient.name}
                              </span>
                            </span>
                            <span className="text-sm font-semibold">
                              {isRemoved ? (
                                <span className="rounded bg-laranja-claro px-2 py-0.5 text-marrom">
                                  Removido
                                </span>
                              ) : (
                                <span className="text-cinza">Incluso</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* Caso 2: Ingredientes adicionais (Extras pagos) */}
                {extraIngredients.length > 0 && (
                  <fieldset className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-laranja-claro">
                    <legend className="px-1 text-sm font-semibold text-marrom">
                      Turbine seu pedido (adicionais)
                    </legend>
                    <p className="mt-1 text-sm text-cinza">
                      Escolha adicionais para deixar seu lanche ainda mais completo:
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {extraIngredients.map((extra) => {
                        const isAdded = addedIngredientIds.includes(extra.id);
                        return (
                          <label
                            key={extra.id}
                            className={`flex min-h-11 cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 transition-colors ${
                              isAdded
                                ? "bg-amarelo-claro text-marrom ring-1 ring-amarelo-intenso"
                                : "bg-branco-suave text-marrom hover:bg-amarelo-claro/50"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isAdded}
                                onChange={() => toggleExtraIngredient(extra.id)}
                                className="h-5 w-5 rounded border-cinza text-laranja-escuro focus:ring-marrom"
                              />
                              <span className="text-sm font-medium">
                                {extra.name}
                              </span>
                            </span>
                            <span className="text-sm font-bold text-laranja-escuro">
                              + {formatBRL(extra.extraPrice)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* Caso 3: Produto sem ingredientes personalizáveis */}
                {product.ingredients.length === 0 && (
                  <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-cinza ring-1 ring-laranja-claro">
                    Este item é servido pronto e não possui opções de personalização.
                  </div>
                )}
              </div>

              {/* SELETOR DE QUANTIDADE E PREÇO DINÂMICO */}
              <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-laranja-claro">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-sm font-semibold uppercase tracking-wider text-cinza">
                      Quantidade
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDecreaseQuantity}
                        disabled={quantity <= 1}
                        aria-label="Diminuir quantidade"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-branco-suave text-lg font-bold text-marrom ring-1 ring-laranja-claro transition-colors hover:bg-amarelo-claro disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>
                      <span
                        aria-live="polite"
                        className="inline-flex h-11 min-w-12 items-center justify-center text-center font-inter text-lg font-bold text-marrom"
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncreaseQuantity}
                        disabled={quantity >= 99}
                        aria-label="Aumentar quantidade"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-branco-suave text-lg font-bold text-marrom ring-1 ring-laranja-claro transition-colors hover:bg-amarelo-claro disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Resumo do Valor Total Calculado */}
                  <div className="text-right" aria-live="polite">
                    <span className="block text-sm font-semibold uppercase tracking-wider text-cinza">
                      Total ({quantity} {quantity === 1 ? "unidade" : "unidades"})
                    </span>
                    <span className="mt-1 block text-2xl font-black text-laranja-escuro sm:text-3xl">
                      {formatBRL(totalPrice)}
                    </span>
                    {extrasUnitPrice > 0 && (
                      <span className="block text-sm text-cinza">
                        (Unitário: {formatBRL(unitPrice)})
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTÃO PRINCIPAL: ADICIONAR AO CARRINHO */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-laranja-escuro px-6 text-base font-bold text-white shadow-md transition-all hover:bg-marrom hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marrom active:scale-[0.99]"
                  >
                    <span>Adicionar ao carrinho</span>
                    <span aria-hidden="true">•</span>
                    <span>{formatBRL(totalPrice)}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* MODAL / DIALOG DE CONFIRMAÇÃO DE ITEM ADICIONADO AO CARRINHO */}
      {product && (
        <dialog
          ref={dialogRef}
          onCancel={() => setShowAddedModal(false)}
          aria-labelledby="titulo-adicionado"
          className="fixed inset-0 m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto border-0 bg-transparent p-0 text-marrom backdrop:bg-marrom/60"
        >
          <div className="animate-in fade-in zoom-in-95 rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-laranja-claro sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amarelo-claro text-2xl">
                ✅
              </div>
              <div>
                <h3 id="titulo-adicionado" className="text-xl font-bold text-marrom">
                  Adicionado ao carrinho!
                </h3>
                <p className="text-sm text-cinza">
                  {quantity}x {product.name}
                </p>
              </div>
            </div>

            {/* Resumo da personalização feita */}
            {(removedIngredientIds.length > 0 || addedIngredientIds.length > 0) && (
              <div className="mt-4 rounded-xl bg-branco-suave p-3 text-sm text-cinza">
                {removedIngredientIds.length > 0 && (
                  <p>
                    <strong className="text-marrom">Sem: </strong>
                    {removedIngredientIds
                      .map((id) => product.ingredients.find((i) => i.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {addedIngredientIds.length > 0 && (
                  <p className="mt-1">
                    <strong className="text-marrom">Adicionais: </strong>
                    {addedIngredientIds
                      .map((id) => product.ingredients.find((i) => i.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-laranja-claro pt-3">
              <span className="text-sm font-medium text-cinza">Valor total do item:</span>
              <span className="text-lg font-bold text-laranja-escuro">
                {formatBRL(totalPrice)}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowAddedModal(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-branco-suave px-4 text-sm font-semibold text-marrom ring-1 ring-laranja-claro transition-colors hover:bg-amarelo-claro"
              >
                Continuar escolhendo
              </button>
              <Link
                href="/carrinho"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-laranja-escuro px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marrom"
              >
                Ir para o carrinho
              </Link>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
