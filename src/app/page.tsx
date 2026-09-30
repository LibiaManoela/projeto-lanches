"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/services/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getSession() ? "/cardapio" : "/login");
  }, [router]);

  return <p className="p-6 text-center" role="status">Abrindo Aplicativo...</p>;
}
