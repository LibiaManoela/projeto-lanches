"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { formatBRL } from "@/lib/format";
import { formatOrderDate, ORDER_STATUS } from "@/lib/orders";
import { ApiError } from "@/services/api";
import { clearSession, getSession, type SessionUser } from "@/services/auth";
import { getOrders, type OrderSummary } from "@/services/orders";

type PageStatus = "loading" | "ok" | "error";

const cardClass =
  "block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-laranja-claro transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marrom";

export default function PedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [status, setStatus] = useState<PageStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  const loadOrders = useCallback(async (userId: number, signal: AbortSignal) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const data = await getOrders(userId, signal);
      setOrders(data);
      setStatus("ok");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      setErrorMessage(
        error instanceof ApiError ? error.message : "Não foi possível carregar seus pedidos.",
      );
      setStatus("error");
    }
  }, [router]);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);

    const controller = new AbortController();
    void loadOrders(session.id, controller.signal);
    return () => controller.abort();
  }, [loadOrders, router, attempt]);

  function retry() {
    if (user) setAttempt((current) => current + 1);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Header showBackToCardapio />

      <h1 className="text-[28px] font-bold text-marrom">Meus pedidos</h1>
      <p className="mt-1 text-cinza">Selecione um pedido para acompanhar os detalhes e o andamento.</p>

      {status === "loading" && (
        <p className="mt-6" role="status">Carregando seus pedidos...</p>
      )}

      {status === "error" && (
        <section role="alert" className="mt-6 rounded-2xl bg-laranja-claro p-5">
          <p className="font-medium text-marrom">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 min-h-11 rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white hover:bg-marrom"
          >
            Tentar novamente
          </button>
        </section>
      )}

      {status === "ok" && orders.length === 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-laranja-claro">
          <h2 className="text-lg font-semibold text-marrom">Você ainda não fez pedidos</h2>
          <p className="mt-2 text-cinza">Quando fizer um pedido, ele aparecerá nesta lista.</p>
          <Link
            href="/cardapio"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white hover:bg-marrom"
          >
            Ver cardápio
          </Link>
        </section>
      )}

      {status === "ok" && orders.length > 0 && (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const orderStatus = ORDER_STATUS[order.status];
            const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
            const itemNames = order.items.map((item) => item.name).join(", ");

            return (
              <li key={order.id}>
                <Link
                  href={`/pedido/${order.id}`}
                  aria-label={`Acompanhar pedido número ${order.id}, status ${orderStatus.label}`}
                  className={cardClass}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-poppins text-lg font-semibold text-marrom">
                        Pedido #{order.id}
                      </h2>
                      <p className="mt-1 text-sm text-cinza">
                        {formatOrderDate(order.createdAt) || "Data indisponível"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${orderStatus.badge}`}>
                      {orderStatus.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-cinza">
                    {itemCount} {itemCount === 1 ? "item" : "itens"}: {itemNames}
                  </p>
                  <p className="mt-2 font-semibold text-marrom">Total: {formatBRL(order.total)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
