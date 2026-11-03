/* Cliente HTTP da API.
   ---------------------------------------------------------------
   Toda chamada carrega o cookie de sessão (`credentials: "include"`):
   o token vive num cookie HttpOnly, então o JavaScript nunca o lê nem
   o guarda. Sem isso, nenhuma rota autenticada responde.
   --------------------------------------------------------------- */

const BASE = (import.meta.env?.VITE_API_URL as string | undefined) ?? "/api";

/** A sessão caiu: as telas ouvem este evento e voltam para o login. */
export const EVENTO_SESSAO_CAIU = "media-stance:sessao-caiu";

export class ErroDaApi extends Error {
  readonly status: number;
  /** Segundos até poder tentar de novo (só em 429). */
  readonly retryAfter: number | null;

  constructor(status: number, mensagem: string, retryAfter: number | null = null) {
    super(mensagem);
    this.name = "ErroDaApi";
    this.status = status;
    this.retryAfter = retryAfter;
  }

  /** 429: pedir para esperar em vez de dizer que a senha está errada. */
  get precisaEsperar(): boolean {
    return this.status === 429;
  }
}

type Opcoes = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  corpo?: unknown;
  sinal?: AbortSignal;
};

export function montarConsulta(
  valores: Record<string, string | number | boolean | null | undefined>,
): string {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor === null || valor === undefined || valor === "") continue;
    parametros.set(chave, String(valor));
  }
  const texto = parametros.toString();
  return texto ? `?${texto}` : "";
}

export async function requisitar<T>(
  caminho: string,
  opcoes: Opcoes = {},
): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      credentials: "include",
      headers:
        opcoes.corpo === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      signal: opcoes.sinal,
    });
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === "AbortError") throw erro;
    throw new ErroDaApi(0, "Não foi possível falar com o servidor.");
  }

  if (resposta.status === 401) {
    window.dispatchEvent(new Event(EVENTO_SESSAO_CAIU));
  }

  if (resposta.status === 204) return undefined as T;

  if (!resposta.ok) {
    let detalhe = "";
    try {
      const corpo = await resposta.json();
      if (typeof corpo?.detail === "string") detalhe = corpo.detail;
    } catch {
      /* resposta sem JSON: usa a mensagem genérica */
    }
    const espera = Number(resposta.headers.get("Retry-After"));
    throw new ErroDaApi(
      resposta.status,
      detalhe || `Falha na requisição (${resposta.status}).`,
      Number.isFinite(espera) && espera > 0 ? espera : null,
    );
  }

  if (resposta.status === 200 && resposta.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await resposta.json()) as T;
}
