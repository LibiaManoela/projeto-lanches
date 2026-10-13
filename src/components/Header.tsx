"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getSession, type SessionUser } from "@/services/auth";
import { useCart } from "@/store/carrinho";

interface HeaderProps {
  showBackToCardapio?: boolean;
}

export default function Header({ showBackToCardapio = false }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const { totalCount } = useCart();

  useEffect(() => {
    setUser(getSession());
  }, []);

  function handleSignOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="mb-8 flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-laranja-claro pb-4">
      <div className="flex items-center gap-4">
        {showBackToCardapio && (
          <Link
            href="/cardapio"
            className="flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-laranja-escuro transition-colors hover:bg-laranja-claro/50"
            aria-label="Voltar para o cardápio"
          >
            <span aria-hidden="true" className="text-lg">←</span>
            <span>Cardápio</span>
          </Link>
        )}
        <Link
          href="/cardapio"
          className="font-poppins text-2xl font-bold tracking-tight text-laranja-escuro"
        >
          APLICATIVO
        </Link>
      </div>

      <nav aria-label="Navegação do usuário" className="flex items-center gap-3 sm:gap-4">
        {user ? (
          <span className="hidden text-sm text-cinza md:inline">
            Olá, <strong className="font-medium text-marrom">{user.name}</strong>
          </span>
        ) : (
          <Link
            href="/login"
            className="min-h-11 inline-flex items-center px-2 text-sm font-medium text-laranja-escuro underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        )}

        {/* Link do carrinho com contador acessível */}
        <Link
          href="/carrinho"
          className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white px-3.5 py-2 text-sm font-medium text-marrom ring-1 ring-laranja-claro transition-colors hover:bg-amarelo-claro"
          aria-label={totalCount > 0 ? `Carrinho de compras com ${totalCount} ${totalCount === 1 ? 'item' : 'itens'}` : "Carrinho de compras vazio"}
        >
          <span aria-hidden="true" className="mr-1.5 text-base">🛒</span>
          <span className="font-semibold text-laranja-escuro">Carrinho</span>
          {totalCount > 0 && (
            <span
              className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-laranja-escuro px-1.5 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {totalCount}
            </span>
          )}
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            className="min-h-11 rounded-md px-3 text-sm font-medium text-laranja-escuro underline-offset-4 hover:underline"
          >
            Sair
          </button>
        )}
      </nav>
    </header>
  );
}
