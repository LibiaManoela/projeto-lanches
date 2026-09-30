"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/api";
import { getSession, login, register, saveSession } from "@/services/auth";

type Mode = "login" | "register";

export default function LoginPage() {
	const router = useRouter();
	const [mode, setMode] = useState<Mode>("login");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (getSession()) router.replace("/cardapio");
	}, [router]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage("");
		setSubmitting(true);

		try {
			const user = mode === "login"
				? await login(email, password)
				: await register(name, email, password);
			saveSession(user);
			router.replace("/cardapio");
		} catch (error) {
			setErrorMessage(
				error instanceof ApiError ? error.message : "Não foi possível concluir. Tente novamente.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	function switchMode(nextMode: Mode) {
		setMode(nextMode);
		setErrorMessage("");
	}

	return (
		<div className="grid min-h-[calc(100svh-1px)] bg-amarelo-claro lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
			<section className="relative hidden min-h-screen overflow-hidden bg-laranja p-12 text-marrom lg:flex lg:flex-col lg:justify-between">
				<a href="/cardapio" className="font-poppins text-3xl font-bold">Aplicativo</a>
				<div className="relative z-10 max-w-lg pb-10">
					<p className="text-sm font-semibold uppercase">Bons lanches, sem complicação</p>
					<h1 className="mt-3 text-5xl font-bold leading-tight">Seu próximo lanche favorito está aqui.</h1>
					<p className="mt-4 max-w-md text-lg">Explore o cardápio e encontre algo gostoso para hoje.</p>
				</div>
				<div aria-hidden="true" className="absolute -bottom-24 -right-16 size-80 rounded-full border-[36px] border-laranja-claro/70" />
			</section>

			<section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
				<div className="w-full max-w-md">
					<a href="/cardapio" className="font-poppins text-2xl font-bold text-laranja-escuro lg:hidden">Aplicativo</a>
					<p className="mt-8 text-sm font-semibold text-laranja-escuro">BEM-VINDO À Aplicativo</p>
					<h1 className="mt-2 text-[28px] font-bold">
						{mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
					</h1>
					<p className="mt-2 text-cinza">
						{mode === "login" ? "Acesse para pedir seus favoritos." : "Cadastre-se para começar seu pedido."}
					</p>

					<div className="mt-7 grid grid-cols-2 border-b border-laranja-claro" role="group" aria-label="Acesso à conta">
						<button type="button" aria-pressed={mode === "login"} onClick={() => switchMode("login")} className={`min-h-11 border-b-2 font-medium ${mode === "login" ? "border-laranja-escuro text-laranja-escuro" : "border-transparent text-cinza"}`}>
							Entrar
						</button>
						<button type="button" aria-pressed={mode === "register"} onClick={() => switchMode("register")} className={`min-h-11 border-b-2 font-medium ${mode === "register" ? "border-laranja-escuro text-laranja-escuro" : "border-transparent text-cinza"}`}>
							Criar conta
						</button>
					</div>

					<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
						{mode === "register" && (
							<div>
								<label htmlFor="name" className="mb-1 block font-medium">Nome</label>
								<input id="name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 w-full rounded-md border border-cinza bg-white px-4" />
							</div>
						)}
						<div>
							<label htmlFor="email" className="mb-1 block font-medium">E-mail</label>
							<input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-md border border-cinza bg-white px-4" />
						</div>
						<div>
							<label htmlFor="password" className="mb-1 block font-medium">Senha</label>
							<input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-md border border-cinza bg-white px-4" />
							{mode === "register" && <p className="mt-1 text-sm text-cinza">Use pelo menos 8 caracteres.</p>}
						</div>

						{errorMessage && <p role="alert" className="rounded-md bg-laranja-claro p-3 font-medium">{errorMessage}</p>}

						<button type="submit" disabled={submitting} className="min-h-12 w-full rounded-md bg-laranja-escuro px-5 text-base font-semibold text-white transition-colors hover:bg-marrom disabled:cursor-wait disabled:opacity-70">
							{submitting ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
						</button>
					</form>
				</div>
			</section>
		</div>
	);
}
