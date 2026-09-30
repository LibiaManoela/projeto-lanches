import Link from "next/link";

export default function CheckoutPage() {
	return (
		<section className="mx-auto max-w-3xl px-4 py-12">
			<h1 className="text-2xl font-bold">Checkout</h1>
			<p className="mt-2 text-cinza">Esta etapa será implementada em seguida.</p>
			<Link href="/cardapio" className="mt-5 inline-block font-medium text-laranja-escuro underline">Voltar ao cardápio</Link>
		</section>
	);
}
