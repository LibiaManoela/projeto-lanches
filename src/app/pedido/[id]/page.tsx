"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import {
  describeItemChanges,
  formatOrderDate,
  isFinalStatus,
  lineTotal,
  ORDER_STATUS,
  STATUS_STEPS,
} from "@/lib/orders";
import { paymentMethodById } from "@/lib/payment-methods";
import type { Order } from "@/lib/types";
import { formatPhone } from "@/lib/validators";
import { ApiError } from "@/services/api";
import { clearSession, getSession, type SessionUser } from "@/services/auth";
import { getOrder, updateOrderStatus } from "@/services/orders";

type Status = "loading" | "ok" | "error";

// Intervalo entre consultas automáticas (a API não tem tempo real: usamos polling moderado).
const REFRESH_MS = 15000;

const cardClass = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-laranja-claro sm:p-6";

export default function PedidoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

  const [user, setUser] = useState<SessionUser | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const hasOrderRef = useRef(false);

  const load = useCallback(
    async (userId: number, background: boolean) => {
      controllerRef.current?.abort(); // só a consulta mais recente vale
      const controller = new AbortController();
      controllerRef.current = controller;
      if (background) setRefreshing(true);

      try {
        // /pedido/1?simular=erro mostra o estado de erro (útil na apresentação)
        const simular = new URLSearchParams(window.location.search).get("simular") ?? undefined;
        const data = await getOrder(userId, orderId, { simular }, controller.signal);
        hasOrderRef.current = true;
        setOrder(data);
        setStatus("ok");
        setRefreshFailed(false);
        setUpdatedAt(new Date());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (hasOrderRef.current) {
          // Já temos um pedido na tela: mantém os dados e só avisa que não atualizou.
          setRefreshFailed(true);
        } else {
          // Sessão não reconhecida pelo servidor: limpa para o login não voltar ao cardápio.
          if (error instanceof ApiError && error.status === 401) clearSession();
          setErrorMessage(error instanceof ApiError ? error.message : "Erro inesperado. Tente novamente.");
          setErrorCode(error instanceof ApiError ? error.status : 0);
          setStatus("error");
        }
      } finally {
        if (controllerRef.current === controller) setRefreshing(false);
      }
    },
    [orderId],
  );

  // Sessão + primeira consulta. O pedido é buscado pelo id da URL, então F5 funciona.
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);

    // Veio do checkout: mostra a confirmação uma vez e limpa o parâmetro da URL.
    const search = new URLSearchParams(window.location.search);
    if (search.get("confirmado") === "1") {
      setConfirmed(true);
      search.delete("confirmado");
      const rest = search.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${rest ? `?${rest}` : ""}`);
    }

    load(session.id, false);
    return () => controllerRef.current?.abort();
  }, [router, load]);

  // Atualização periódica: só enquanto o pedido não terminou e a aba está visível.
  const currentStatus = order?.status;
  useEffect(() => {
    if (!user || !currentStatus || isFinalStatus(currentStatus)) return;

    const refresh = () => {
      if (document.visibilityState === "visible") load(user.id, true);
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh); // atualiza ao voltar para a aba
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user, currentStatus, load]);

  function retry() {
    if (!user) return;
    setStatus("loading");
    load(user.id, false);
  }

  async function cancelOrder() {
    if (!user || !order || !["recebido", "em_preparo"].includes(order.status)) return;
    if (!window.confirm("Deseja cancelar este pedido?")) return;

    setCancelling(true);
    setCancelError("");
    controllerRef.current?.abort();
    try {
      const updatedOrder = await updateOrderStatus(user.id, orderId, "cancelado");
      setOrder(updatedOrder);
      setUpdatedAt(new Date());
      setRefreshFailed(false);
    } catch (error) {
      setCancelError(
        error instanceof ApiError ? error.message : "Não foi possível cancelar o pedido. Tente novamente.",
      );
    } finally {
      setCancelling(false);
    }
  }

  const statusInfo = order ? ORDER_STATUS[order.status] : undefined;
  const stepIndex = order ? STATUS_STEPS.findIndex((step) => step.id === order.status) : -1;
  const delivered = order?.status === "entregue";
  const payment = order ? paymentMethodById(order.paymentMethod) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-8 flex min-h-12 items-center justify-between gap-4 border-b border-laranja-claro pb-4">
        <Link href="/cardapio" className="font-poppins text-2xl font-bold text-laranja-escuro">Aplicativo</Link>
        <Link href="/cardapio" className="inline-flex min-h-11 items-center rounded-md px-3 font-medium text-laranja-escuro underline-offset-4 hover:underline">
          Voltar ao cardápio
        </Link>
      </header>

      <h1 className="text-[28px] font-bold">Acompanhamento do pedido</h1>

      {status === "loading" && <p className="mt-4" role="status">Carregando pedido...</p>}

      {status === "error" && (
        <div role="alert" className="mt-4 rounded-2xl bg-laranja-claro p-5">
          <p className="font-medium">{errorMessage}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {errorCode === 401 && (
              <Link href="/login" className="inline-flex min-h-11 items-center rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white">
                Entrar novamente
              </Link>
            )}
            {errorCode !== 401 && errorCode !== 404 && (
              <button type="button" onClick={retry} className="min-h-11 rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white">
                Tentar novamente
              </button>
            )}
            {errorCode === 404 && (
              <Link href="/cardapio" className="inline-flex min-h-11 items-center rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white">
                Ver cardápio
              </Link>
            )}
          </div>
        </div>
      )}

      {status === "ok" && order && (
        <div className="mt-4 space-y-4">
          {confirmed && (
            <p role="status" className="rounded-2xl bg-amarelo-claro p-4 font-medium">
              Pedido realizado com sucesso! Acompanhe o andamento aqui.
            </p>
          )}

          <section aria-labelledby="status-titulo" className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="status-titulo" className="font-poppins text-lg font-semibold">Pedido #{order.id}</h2>
                {formatOrderDate(order.createdAt) && (
                  <p className="text-sm text-cinza">Feito em {formatOrderDate(order.createdAt)}</p>
                )}
              </div>
              {/* Região "ao vivo": leitores de tela anunciam quando o status muda */}
              <p aria-live="polite" className={`rounded-full px-4 py-1 text-[15px] font-semibold ${statusInfo?.badge ?? "bg-amarelo-claro text-marrom"}`}>
                {statusInfo?.label ?? "Status desconhecido"}
              </p>
            </div>

            <p className="mt-3 text-cinza">{statusInfo?.description ?? "Não foi possível interpretar o status deste pedido."}</p>

            {statusInfo && order.status !== "cancelado" && (
              <ol aria-label="Etapas do pedido" className="mt-5 grid grid-cols-4 gap-2">
                {STATUS_STEPS.map((step, index) => {
                  const done = delivered || index < stepIndex;
                  const active = !delivered && index === stepIndex;
                  return (
                    <li key={step.id} aria-current={active ? "step" : undefined} className="flex flex-col items-center gap-2 text-center text-sm">
                      <span
                        aria-hidden="true"
                        className={`flex size-9 items-center justify-center rounded-full font-bold ring-1 ${
                          done
                            ? "bg-laranja-escuro text-white ring-laranja-escuro"
                            : active
                              ? "bg-amarelo text-marrom ring-marrom"
                              : "bg-white text-cinza ring-cinza"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <span className={active ? "font-semibold" : done ? "" : "text-cinza"}>
                        {step.label}
                        {done && <span className="sr-only"> (concluída)</span>}
                        {active && <span className="sr-only"> (etapa atual)</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-laranja-claro pt-4">
              <button
                type="button"
                onClick={() => user && load(user.id, true)}
                disabled={refreshing}
                className="min-h-11 rounded-full bg-laranja-escuro px-5 text-[15px] font-medium text-white disabled:cursor-wait disabled:opacity-70"
              >
                {refreshing ? "Atualizando..." : "Atualizar"}
              </button>
              {["recebido", "em_preparo"].includes(order.status) && (
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="min-h-11 rounded-full border border-marrom px-5 text-[15px] font-medium text-marrom hover:bg-branco-suave disabled:cursor-wait disabled:opacity-70"
                >
                  {cancelling ? "Cancelando..." : "Cancelar pedido"}
                </button>
              )}
              {updatedAt && (
                <p className="text-sm text-cinza">
                  Atualizado às {updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
            </div>
            {refreshFailed && (
              <p role="status" className="mt-3 rounded-md bg-laranja-claro p-3 text-sm font-medium">
                Não foi possível atualizar agora. Mostrando a última informação recebida.
              </p>
            )}
            {cancelError && (
              <p role="alert" className="mt-3 rounded-md bg-laranja-claro p-3 text-sm font-medium">
                {cancelError}
              </p>
            )}
          </section>

          <section aria-labelledby="itens-titulo" className={cardClass}>
            <h2 id="itens-titulo" className="font-poppins text-lg font-semibold">Itens do pedido</h2>
            <ul className="mt-3 divide-y divide-laranja-claro">
              {order.items.map((item, index) => {
                const changes = describeItemChanges(item);
                return (
                  <li key={`${item.productId}-${index}`} className="flex justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{item.quantity}x {item.name}</p>
                      {changes.length > 0 && <p className="text-sm text-cinza">{changes.join(", ")}</p>}
                    </div>
                    <p className="shrink-0 font-medium">{formatBRL(lineTotal(item))}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 flex items-baseline justify-between border-t border-laranja-claro pt-4 text-lg font-bold">
              <span>Total</span>
              <span className="text-laranja-escuro">{formatBRL(order.total)}</span>
            </p>
          </section>

          <section aria-labelledby="entrega-titulo" className={cardClass}>
            <h2 id="entrega-titulo" className="font-poppins text-lg font-semibold">Entrega e pagamento</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="font-medium">Endereço</dt>
              <dd className="text-cinza">
                {order.address}, {order.number}
                {order.complement && ` - ${order.complement}`}
              </dd>
              <dt className="font-medium">CEP</dt>
              <dd className="text-cinza">{order.zipCode}</dd>
              <dt className="font-medium">Telefone</dt>
              <dd className="text-cinza">{formatPhone(order.phone)}</dd>
              <dt className="font-medium">Pagamento</dt>
              <dd className="text-cinza">{payment?.label ?? order.paymentMethod}</dd>
              {order.notes && (
                <>
                  <dt className="font-medium">Observações</dt>
                  <dd className="whitespace-pre-line text-cinza">{order.notes}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}