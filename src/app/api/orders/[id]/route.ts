import { NextRequest, NextResponse } from "next/server";
import { findOrderById, getRequestUserId, updateOrderStatus } from "@/lib/mock-orders";
import { ORDER_STATUS, STATUS_TRANSITIONS, isOrderStatus } from "@/lib/orders";

type Context = { params: Promise<{ id: string }> };

function parseId(value: string) {
	return /^\d+$/.test(value) ? Number(value) : null;
}

// GET /api/orders/1  (cabeçalho X-User-Id: só o dono do pedido o enxerga)
// Para testar o tratamento de erro: /api/orders/1?simular=erro
export async function GET(request: NextRequest, { params }: Context) {
	if (request.nextUrl.searchParams.get("simular") === "erro") {
		return NextResponse.json(
			{ message: "Erro interno simulado. Tente novamente em instantes." },
			{ status: 500 },
		);
	}

	const userId = getRequestUserId(request);
	if (userId === null) {
		return NextResponse.json({ message: "Sessão inválida. Entre novamente." }, { status: 401 });
	}

	const id = parseId((await params).id);
	const order = id === null ? undefined : findOrderById(id);
	// Pedido de outro usuário responde 404 (não revela que ele existe).
	if (!order || order.userId !== userId) {
		return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
	}

	return NextResponse.json(order);
}

// PATCH /api/orders/1  { "status": "em_preparo" }
// Não existe perfil de lojista no projeto: esta rota é a forma de avançar o status
// (ex.: por curl) e NÃO tem autorização. Em produção, restrinja-a à operação da loja.
export async function PATCH(request: Request, { params }: Context) {
	const id = parseId((await params).id);
	const order = id === null ? undefined : findOrderById(id);
	if (!order) {
		return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
	}

	const status = body && typeof body === "object" ? (body as { status?: unknown }).status : undefined;
	if (!isOrderStatus(status)) {
		return NextResponse.json({ message: "Informe um status válido." }, { status: 422 });
	}
	if (!STATUS_TRANSITIONS[order.status].includes(status)) {
		return NextResponse.json(
			{ message: `Não é possível mudar o pedido de "${ORDER_STATUS[order.status].label}" para "${ORDER_STATUS[status].label}".` },
			{ status: 409 },
		);
	}

	return NextResponse.json(updateOrderStatus(order, status));
}

export function DELETE() {
	return Response.json({ message: "A API de pedidos será implementada em seguida." }, { status: 501 });
}