import type {
  Conta,
  FiltrosDeComentarios,
  FiltrosDeDemandas,
  PaginaDeComentarios,
  PainelDeDemandas,
  Perfil,
  ResumoDoDia,
} from "./tipos";
import * as mock from "./mock";

export * from "./tipos";

/* Camada de acesso a dados.
   ---------------------------------------------------------------
   Enquanto o back-end não está de pé, cada função devolve o mock
   depois de um atraso curto — assim os estados de carregamento são
   exercitados de verdade desde já.

   Para ligar na API real, troque o corpo da função por um fetch e
   apague o atraso. A assinatura não muda, então nenhuma tela precisa
   ser tocada:

     export async function obterResumoDoDia(): Promise<ResumoDoDia> {
       const r = await fetch(`${BASE}/resumo-do-dia`);
       if (!r.ok) throw new Error(`Falha ao carregar o resumo (${r.status})`);
       return r.json();
     }
   --------------------------------------------------------------- */

const USANDO_MOCK = true;

function atraso<T>(valor: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

/** Conta do parlamentar em sessão. Virá do endpoint de sessão. */
export async function obterConta(): Promise<Conta> {
  if (USANDO_MOCK) return atraso(mock.resumoDoDia().conta, 150);
  throw new Error("API real ainda não configurada");
}

export async function obterResumoDoDia(): Promise<ResumoDoDia> {
  if (USANDO_MOCK) return atraso(mock.resumoDoDia());
  throw new Error("API real ainda não configurada");
}

export async function obterComentarios(
  filtros: FiltrosDeComentarios,
): Promise<PaginaDeComentarios> {
  if (USANDO_MOCK) return atraso(mock.paginaDeComentarios(filtros));
  throw new Error("API real ainda não configurada");
}

export async function obterDemandas(
  filtros: FiltrosDeDemandas,
): Promise<PainelDeDemandas> {
  if (USANDO_MOCK) return atraso(mock.painelDeDemandas(filtros));
  throw new Error("API real ainda não configurada");
}

export async function obterPerfil(): Promise<Perfil> {
  if (USANDO_MOCK) return atraso(mock.perfil, 200);
  throw new Error("API real ainda não configurada");
}

/**
 * Troca a senha da pessoa em sessão.
 *
 * A senha atual vai junto de propósito: quem conferiu que ela confere é o
 * servidor, nunca o front. Nada aqui valida credencial — só formato.
 */
export async function alterarSenha(
  senhaAtual: string,
  novaSenha: string,
): Promise<void> {
  if (!USANDO_MOCK) throw new Error("API real ainda não configurada");
  await atraso(null, 600);
  // Enquanto não há back-end, erra para exercitar o caminho de falha.
  if (senhaAtual === novaSenha) {
    throw new Error("A nova senha precisa ser diferente da atual.");
  }
}

/* ---- Autenticação ----------------------------------------------------
   Nenhuma destas funções verifica credencial: quem verifica é o servidor.
   O que existe aqui é o contrato e a simulação do caminho feliz e do de
   erro, para que as telas possam ser construídas e demonstradas. */

export async function entrar(email: string, senha: string): Promise<void> {
  if (!USANDO_MOCK) throw new Error("API real ainda não configurada");
  await atraso(null, 700);
  if (!email.includes("@") || senha.length < 8) {
    // Mensagem única de propósito: dizer qual dos dois errou revela se o
    // e-mail existe na base, e isso é o que se usa para descobrir contas.
    throw new Error("E-mail ou senha incorretos.");
  }
}

export async function criarConta(dados: {
  nome: string;
  email: string;
  senha: string;
}): Promise<void> {
  if (!USANDO_MOCK) throw new Error("API real ainda não configurada");
  await atraso(null, 700);
  if (dados.email.endsWith("@exemplo.com")) {
    throw new Error("Já existe uma conta com este e-mail.");
  }
}

/**
 * Pede o link de redefinição.
 *
 * Nunca diz se o e-mail existe: a tela responde a mesma coisa nos dois
 * casos, pelo mesmo motivo da mensagem única do login.
 */
export async function solicitarRedefinicao(email: string): Promise<void> {
  if (!USANDO_MOCK) throw new Error("API real ainda não configurada");
  await atraso(null, 700);
  void email;
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<void> {
  if (!USANDO_MOCK) throw new Error("API real ainda não configurada");
  await atraso(null, 700);
  if (!token) throw new Error("Link inválido ou expirado. Peça um novo.");
  void novaSenha;
}
