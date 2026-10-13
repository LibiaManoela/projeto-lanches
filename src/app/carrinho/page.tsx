"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/store/carrinho";

export default function CarrinhoPage() {
  const { items, totalCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Header showBackToCardapio={true} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-marrom">Seu Carrinho</h1>
          <p className="mt-1 text-cinza">
            {totalCount === 0
              ? "Nenhum item adicionado ainda."
              : `${totalCount} ${totalCount === 1 ? "item adicionado" : "itens adicionados"}`}
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="min-h-11 rounded-full px-4 text-sm font-medium text-coral underline-offset-4 hover:underline"
          >
            Limpar carrinho
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <section
          aria-label="Carrinho vazio"
          className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-laranja-claro"
        >
          <span aria-hidden="true" className="text-6xl">🛒</span>
          <h2 className="mt-4 text-xl font-bold text-marrom">Seu carrinho está vazio</h2>
          <p className="mt-2 text-cinza">
            Explore o nosso cardápio e adicione lanches deliciosos!
          </p>
          <div className="mt-6">
            <Link
              href="/cardapio"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-laranja-escuro px-6 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-laranja"
            >
              Ver cardápio
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Lista de itens */}
          <ul className="space-y-4">
            {items.map((item, index) => {
              const itemTotal = item.unitPrice * item.quantity;
              return (
                <li
                  key={`${item.productId}-${index}`}
                  className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-laranja-claro sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <h3 className="font-poppins text-lg font-bold text-marrom">
                      <Link
                        href={`/produto/${item.productId}`}
                        className="hover:text-laranja-escuro hover:underline"
                      >
                        {item.name}
                      </Link>
                    </h3>

                    {/* Exibição de personalizações */}
                    {(item.removedIngredients.length > 0 || item.addedIngredients.length > 0) && (
                      <div className="mt-1 space-y-0.5 text-xs text-cinza">
                        {item.removedIngredients.length > 0 && (
                          <p>
                            <span className="font-medium text-coral">Sem: </span>
                            {item.removedIngredients.join(", ")}
                          </p>
                        )}
                        {item.addedIngredients.length > 0 && (
                          <p>
                            <span className="font-medium text-laranja-escuro">Extras: </span>
                            {item.addedIngredients.join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="mt-2 text-sm font-semibold text-laranja-escuro">
                      {formatBRL(item.unitPrice)} cada
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    {/* Stepper de quantidade */}
                    <div className="flex items-center gap-1.5 rounded-full bg-branco-suave p-1 ring-1 ring-laranja-claro">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-marrom hover:bg-amarelo-claro"
                      >
                        −
                      </button>
                      <span className="inline-flex min-w-8 justify-center font-inter text-sm font-bold text-marrom">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-base font-bold text-marrom hover:bg-amarelo-claro"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-inter text-base font-bold text-marrom">
                        {formatBRL(itemTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        aria-label={`Remover ${item.name} do carrinho`}
                        className="mt-1 text-xs text-coral hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Resumo do pedido */}
          <aside
            aria-label="Resumo do pedido"
            className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-laranja-claro"
          >
            <h2 className="text-lg font-bold text-marrom">Resumo</h2>

            <div className="mt-4 space-y-2 border-b border-laranja-claro pb-4 text-sm">
              <div className="flex justify-between text-cinza">
                <span>Subtotal ({totalCount} itens)</span>
                <span className="font-medium text-marrom">{formatBRL(subtotal)}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between font-bold text-marrom">
              <span>Total parcial</span>
              <span className="text-xl text-laranja-escuro">{formatBRL(subtotal)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/checkout"
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-laranja-escuro px-4 text-[15px] font-bold text-white shadow-md transition-colors hover:bg-laranja"
              >
                Continuar para Checkout
              </Link>
              <Link
                href="/cardapio"
                className="flex min-h-11 w-full items-center justify-center rounded-full bg-branco-suave px-4 text-sm font-semibold text-marrom ring-1 ring-laranja-claro transition-colors hover:bg-amarelo-claro"
              >
                Adicionar mais itens
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
