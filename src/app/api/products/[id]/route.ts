import { NextRequest, NextResponse } from "next/server";
import products from "@/mocks/products.json";
import type { Product } from "@/lib/types";

// GET /api/products/:id
// Suporta ?simular=erro (500) e ?simular=404 para testes de avaliação
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;

  if (searchParams.get("simular") === "erro") {
    return NextResponse.json(
      { message: "Erro interno simulado ao carregar produto. Tente novamente." },
      { status: 500 }
    );
  }

  const numericId = Number(id);
  if (isNaN(numericId)) {
    return NextResponse.json(
      { message: "Identificador de produto inválido." },
      { status: 400 }
    );
  }

  if (searchParams.get("simular") === "404") {
    return NextResponse.json(
      { message: "Produto não encontrado." },
      { status: 404 }
    );
  }

  const product = (products as Product[]).find((p) => p.id === numericId);

  if (!product) {
    return NextResponse.json(
      { message: "Produto não encontrado no cardápio." },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}
