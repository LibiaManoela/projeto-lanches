import { NextResponse } from "next/server";
import { addUser, findUserByEmail } from "@/lib/mock-users";

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
	}

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
	}

	const input = body as { name?: unknown; email?: unknown; password?: unknown };
	if (
		typeof input.name !== "string" || !input.name.trim() ||
		typeof input.email !== "string" || !/^\S+@\S+\.\S+$/.test(input.email) ||
		typeof input.password !== "string" || input.password.length < 8
	) {
		return NextResponse.json({ message: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres." }, { status: 422 });
	}

	if (findUserByEmail(input.email)) {
		return NextResponse.json({ message: "Este e-mail já está cadastrado." }, { status: 409 });
	}

	const user = addUser(input.name.trim(), input.email, input.password);
	return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
