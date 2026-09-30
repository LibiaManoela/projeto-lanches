import Image from "next/image";
import Link from "next/link";
import { categoryById } from "@/lib/categories";
import { formatBRL } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const category = categoryById(product.category);

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-laranja-claro focus-within:ring-2 focus-within:ring-marrom">
      <div className="relative flex h-40 items-center justify-center bg-amarelo-claro">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span aria-hidden="true" className="text-6xl">
            {category?.emoji}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-poppins text-lg font-semibold">
          {/* o after: faz o card inteiro ser clicável */}
          <Link href={`/produto/${product.id}`} className="outline-none after:absolute after:inset-0">
            {product.name}
          </Link>
        </h2>
        <p className="text-sm text-cinza">{product.description}</p>
        <p className="mt-auto pt-3 text-lg font-bold text-laranja-escuro">
          {formatBRL(product.price)}
        </p>
      </div>
    </article>
  );
}
