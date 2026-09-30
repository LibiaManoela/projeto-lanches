import { NextRequest, NextResponse } from "next/server";
import products from "@/mocks/products.json";
import type { Product } from "@/lib/types";

// Remove acentos e deixa minúsculo: "Pão" casa com "pao".
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// GET /api/products?category=lanches&q=bacon
// Para testar o tratamento de erro: /api/products?simular=erro
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("simular") === "erro") {
    return NextResponse.json(
      { message: "Erro interno simulado. Tente novamente em instantes." },
      { status: 500 },
    );
  }

  const category = params.get("category")?.trim() ?? "";
  const q = normalize(params.get("q")?.trim() ?? "");

  const result = (products as Product[]).filter((p) => {
    const matchesCategory = category === "" || p.category === category;
    const matchesText =
      q === "" || normalize(`${p.name} ${p.description}`).includes(q);
    return matchesCategory && matchesText;
  });

  return NextResponse.json(result);
}
