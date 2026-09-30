import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/mock-users";

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

	const credentials = body as { email?: unknown; password?: unknown };
	if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
		return NextResponse.json({ message: "Informe e-mail e senha." }, { status: 422 });
	}

	const user = findUserByEmail(credentials.email);
	if (!user || user.password !== credentials.password) {
		return NextResponse.json({ message: "E-mail ou senha incorretos." }, { status: 401 });
	}

	return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
