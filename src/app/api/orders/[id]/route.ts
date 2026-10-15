import { NextRequest, NextResponse } from "next/server";
import { advanceDemoOrderStatus, findOrderById, getRequestUserId, updateOrderStatus } from "@/lib/mock-orders";
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

	advanceDemoOrderStatus(order);
	return NextResponse.json(order);
}

// PATCH /api/orders/1  { "status": "em_preparo" }
// A demonstração operacional via curl não tem perfil de lojista; em produção,
// restrinja essas alterações à operação da loja. Cancelamentos exigem X-User-Id.
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
	// Alterações feitas por um cliente precisam pertencer à sessão informada.
	// Sem X-User-Id, a rota continua disponível para a demonstração operacional via curl.
	if (request.headers.has("x-user-id") || status === "cancelado") {
		const userId = getRequestUserId(request);
		if (userId === null) {
			return NextResponse.json({ message: "Sessão inválida. Entre novamente." }, { status: 401 });
		}
		if (order.userId !== userId) {
			return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
		}
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