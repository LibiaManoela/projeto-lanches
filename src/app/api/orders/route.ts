import { NextResponse } from "next/server";
import products from "@/mocks/products.json";
import { addOrder, findOrderByKey, getRequestUserId } from "@/lib/mock-orders";
import { cartTotal } from "@/lib/orders";
import type { CartItem, CheckoutFields, PaymentMethod, Product } from "@/lib/types";
import { formatCep, normalizePhone, validateCheckout } from "@/lib/validators";

const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;
const MAX_INGREDIENTS = 30;

function text(value: unknown) {
	return typeof value === "string" ? value : "";
}

function ingredientIds(value: unknown) {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > MAX_INGREDIENTS || value.some((id) => typeof id !== "string")) return null;
	return Array.from(new Set(value as string[]));
}

// Monta os itens a partir do cardápio. Nome, preço e extras vêm do servidor:
// o preço enviado pelo cliente é ignorado.
function buildItems(raw: unknown): { items: CartItem[] } | { error: string } {
	if (!Array.isArray(raw) || raw.length === 0) return { error: "Seu carrinho está vazio." };
	if (raw.length > MAX_ITEMS) return { error: "O carrinho tem itens demais." };

	const items: CartItem[] = [];
	for (const entry of raw) {
		if (!entry || typeof entry !== "object") return { error: "Itens do pedido inválidos." };

		const input = entry as Record<string, unknown>;
		const removed = ingredientIds(input.removedIngredients);
		const added = ingredientIds(input.addedIngredients);
		const quantity = input.quantity;
		if (
			!Number.isInteger(input.productId) ||
			!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > MAX_QUANTITY ||
			!removed || !added
		) {
			return { error: "Itens do pedido inválidos." };
		}

		const product = (products as Product[]).find((candidate) => candidate.id === input.productId);
		if (!product) return { error: "Um item do carrinho não está mais disponível no cardápio. Revise seu carrinho." };

		const removable = product.ingredients.filter((ingredient) => ingredient.included);
		const extras = product.ingredients.filter((ingredient) => !ingredient.included);
		if (
			removed.some((id) => !removable.some((ingredient) => ingredient.id === id)) ||
			added.some((id) => !extras.some((ingredient) => ingredient.id === id))
		) {
			return { error: `A personalização de "${product.name}" é inválida. Revise seu carrinho.` };
		}

		const unitCents =
			Math.round(product.price * 100) +
			extras
				.filter((ingredient) => added.includes(ingredient.id))
				.reduce((sum, ingredient) => sum + Math.round(ingredient.extraPrice * 100), 0);

		items.push({
			productId: product.id,
			name: product.name,
			unitPrice: unitCents / 100,
			quantity: quantity as number,
			removedIngredients: removed,
			addedIngredients: added,
		});
	}
	return { items };
}

// POST /api/orders  (cabeçalhos: X-User-Id e, opcional, Idempotency-Key)
export async function POST(request: Request) {
	const userId = getRequestUserId(request);
	if (userId === null) {
		return NextResponse.json({ message: "Sessão inválida. Entre novamente." }, { status: 401 });
	}

	// Mesmo pedido reenviado (duplo clique, nova tentativa): devolve o já criado.
	const key = request.headers.get("idempotency-key")?.trim().slice(0, 100) || undefined;
	if (key) {
		const existing = findOrderByKey(userId, key);
		if (existing) return NextResponse.json(existing, { status: 200 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
	}
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
	}

	const input = body as Record<string, unknown>;
	const fields: CheckoutFields = {
		address: text(input.address),
		number: text(input.number),
		complement: text(input.complement),
		zipCode: text(input.zipCode),
		phone: text(input.phone),
		notes: text(input.notes),
		paymentMethod: text(input.paymentMethod) as PaymentMethod | "",
	};
	const errors = validateCheckout(fields);
	const firstError = Object.values(errors)[0];
	if (firstError) {
		return NextResponse.json({ message: firstError, errors }, { status: 422 });
	}

	const built = buildItems(input.items);
	if ("error" in built) {
		return NextResponse.json({ message: built.error }, { status: 422 });
	}

	const order = addOrder(
		{
			userId,
			items: built.items,
			total: cartTotal(built.items),
			address: fields.address.trim(),
			number: fields.number.trim(),
			complement: fields.complement.trim(),
			zipCode: formatCep(fields.zipCode),
			phone: normalizePhone(fields.phone),
			notes: fields.notes.trim(),
			paymentMethod: fields.paymentMethod as PaymentMethod,
		},
		key,
	);
	return NextResponse.json(order, { status: 201 });
}