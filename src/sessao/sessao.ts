import { useCallback, useEffect, useState } from "react";

import { EVENTO_SESSAO_CAIU } from "../api/cliente";

/* Sessão.
   ---------------------------------------------------------------
   Com `VITE_FONTE=api`, quem decide se há sessão é o servidor: o
   cookie é HttpOnly, então o JavaScript não o lê nem o falsifica. O
   sinalizador local continua existindo só como atalho de navegação —
   ele evita piscar a tela de login enquanto a primeira resposta não
   chega, e é apagado assim que o servidor responde 401.

   Nos modos `mock` e `demo` nada mudou: o sinalizador é a própria
   sessão, porque não há servidor.
   --------------------------------------------------------------- */

const CHAVE = "media-stance:sessao-simulada";

// Um evento próprio porque `storage` só dispara em OUTRAS abas: sem ele,
// entrar ou sair não atualizaria a aba onde a ação aconteceu.
const EVENTO = "media-stance:sessao-mudou";

const BASE = (import.meta.env?.VITE_API_URL as string | undefined) ?? "/api";
const USANDO_API =
  import.meta.env?.VITE_FONTE === "api" || import.meta.env?.MODE === "api";

function avisar() {
  window.dispatchEvent(new Event(EVENTO));
}

export function estaEmSessao(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    // Navegação privada ou armazenamento bloqueado.
    return false;
  }
}

export function abrirSessao() {
  try {
    localStorage.setItem(CHAVE, "1");
  } catch {
    /* segue sem persistir */
  }
  avisar();
}

export function encerrarSessao() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a limpar */
  }
  avisar();
}

/** Pergunta ao servidor se o cookie desta aba ainda vale. */
async function sessaoNoServidor(): Promise<boolean> {
  try {
    const resposta = await fetch(`${BASE}/perfil`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return resposta.status === 200;
  } catch {
    // Servidor fora do ar não é o mesmo que sessão inválida: não
    // derrubar aqui evita deslogar a pessoa por uma queda de rede.
    return estaEmSessao();
  }
}

export function useSessao() {
  const [emSessao, setEmSessao] = useState(estaEmSessao);

  useEffect(() => {
    const atualizar = () => setEmSessao(estaEmSessao());
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener("storage", atualizar);
    window.addEventListener(EVENTO_SESSAO_CAIU, atualizar);
    return () => {
      window.removeEventListener(EVENTO, atualizar);
      window.removeEventListener("storage", atualizar);
      window.removeEventListener(EVENTO_SESSAO_CAIU, atualizar);
    };
  }, []);

  useEffect(() => {
    if (!USANDO_API || !estaEmSessao()) return;
    let ativo = true;
    void sessaoNoServidor().then((valida) => {
      if (ativo && !valida) encerrarSessao();
    });
    return () => {
      ativo = false;
    };
  }, [emSessao]);

  const sair = useCallback(async () => {
    // A tela sai da área interna na hora; o servidor é avisado em
    // seguida. Se a chamada falhar, o cookie expira sozinho.
    encerrarSessao();
    if (!USANDO_API) return;
    try {
      await fetch(`${BASE}/sessao`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch {
      /* sem rede: o cookie expira sozinho */
    }
  }, []);

  return {
    emSessao,
    entrar: useCallback(abrirSessao, []),
    sair,
  };
}
