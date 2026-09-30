"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/lib/categories";
import type { Product } from "@/lib/types";
import { ApiError } from "@/services/api";
import { clearSession, getSession, type SessionUser } from "@/services/auth";
import { getProducts } from "@/services/products";

type Status = "loading" | "ok" | "error";

const FILTERS = [{ id: "", label: "Todos" }, ...CATEGORIES];

export default function CardapioPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setUser(getSession());
  }, []);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  // Busca os produtos sempre que filtro, texto ou "tentar novamente" mudar.
  useEffect(() => {
    const controller = new AbortController();
    // /cardapio?simular=erro mostra o estado de erro (útil na apresentação)
    const simular = new URLSearchParams(window.location.search).get("simular") ?? undefined;

    const timer = setTimeout(async () => {
      try {
        const data = await getProducts({ category, q: query, simular }, controller.signal);
        setProducts(data);
        setStatus("ok");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(
          error instanceof ApiError ? error.message : "Erro inesperado. Tente novamente.",
        );
        setStatus("error");
      }
    }, 300); // espera o usuário parar de digitar

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, query, attempt]);

  function changeQuery(value: string) {
    setQuery(value);
    setStatus("loading");
  }
  function changeCategory(value: string) {
    setCategory(value);
    setStatus("loading");
  }
  function clearFilters() {
    setQuery("");
    setCategory("");
    setStatus("loading");
  }
  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  const hasFilters = query !== "" || category !== "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-8 flex min-h-12 items-center justify-between gap-4 border-b border-laranja-claro pb-4">
        <Link href="/cardapio" className="font-poppins text-2xl font-bold text-laranja-escuro">YUMQUICK</Link>
        <div className="flex items-center gap-3">
          {user && <span className="hidden text-sm text-cinza sm:inline">Olá, {user.name}</span>}
          <button type="button" onClick={signOut} className="min-h-11 rounded-md px-3 font-medium text-laranja-escuro underline-offset-4 hover:underline">
            Sair
          </button>
        </div>
      </header>
      <h1 className="text-[28px] font-bold">Cardápio</h1>
      <p className="mt-1 text-cinza">Escolha seu lanche e faça o pedido.</p>

      <div className="mt-6">
        <label htmlFor="busca" className="mb-1 block text-sm font-medium">
          Buscar no cardápio
        </label>
        <input
          id="busca"
          type="search"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="Ex.: bacon, suco, batata..."
          className="min-h-11 w-full rounded-full border border-cinza bg-white px-5 placeholder:text-cinza"
        />
      </div>

      <div role="group" aria-label="Filtrar por categoria" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={category === f.id}
            onClick={() => changeCategory(f.id)}
            className={`min-h-11 rounded-full px-5 text-[15px] font-medium ring-1 ring-inset transition-colors ${
              category === f.id
                ? "bg-laranja-escuro text-white ring-laranja-escuro"
                : "bg-white text-marrom ring-cinza hover:bg-amarelo-claro"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Região "ao vivo": leitores de tela anunciam o resultado da busca */}
      <div className="mt-6" aria-live="polite">
        {status === "loading" && <p>Carregando cardápio...</p>}
        {status === "ok" && (
          <p className="text-cinza">
            {products.length === 0
              ? "Nenhum item encontrado."
              : `${products.length} ${products.length === 1 ? "item encontrado" : "itens encontrados"}`}
          </p>
        )}
      </div>

      {status === "error" && (
        <div role="alert" className="mt-4 rounded-2xl bg-laranja-claro p-5">
          <p className="font-medium">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 min-h-11 rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {status === "ok" && products.length === 0 && hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-3 min-h-11 rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white"
        >
          Limpar filtros
        </button>
      )}

      {status !== "error" && products.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
