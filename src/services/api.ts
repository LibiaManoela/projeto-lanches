// Função única para chamar a API. Todas as telas usam isto (via services/*),
// assim o tratamento de erro é igual em todo o app.

export class ApiError extends Error {
  status: number; // 0 = sem conexão
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua internet.", 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.message ?? "Algo deu errado. Tente novamente.", response.status);
  }

  return (await response.json()) as T;
}
