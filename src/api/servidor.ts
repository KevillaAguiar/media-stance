/* Implementação real da camada de dados (VITE_FONTE=api).
   ---------------------------------------------------------------
   As assinaturas são as mesmas do mock: nenhuma tela sabe de onde o
   dado veio. O que muda é que aqui não há atraso artificial, e sim o
   servidor — quem decide permissão, sessão e paginação é ele.
   --------------------------------------------------------------- */

import type {
  Cliente,
  ConexaoDeConta,
  ConfiguracaoPolitica,
  Conta,
  ContaDaMeta,
  ContaEmFoco,
  EstadoDaConexao,
  FiltrosDeComentarios,
  FiltrosDeDemandas,
  InicioDeAutorizacao,
  MotivoDeErroDeConexao,
  PaginaDeComentarios,
  PainelDeDemandas,
  Perfil,
  Periodo,
  ResumoDoDia,
  VersaoDeConfiguracao,
} from "./tipos";
import { montarConsulta, requisitar } from "./cliente";

/** O servidor versiona como "1.1"; o front exibe "v1.1". */
function comV(versao: string): string {
  return versao.startsWith("v") ? versao : `v${versao}`;
}

function intervalo(periodo: string, faixa: Periodo | null) {
  return periodo === "personalizado" && faixa
    ? { de: faixa.de, ate: faixa.ate }
    : { de: null, ate: null };
}

type ContaDaApi = {
  id: string;
  nome: string;
  usuario: string | null;
  conectada: boolean;
};

function paraConta(conta: ContaDaApi): ContaEmFoco {
  return {
    id: conta.id,
    nome: conta.nome,
    usuario: conta.usuario ?? "",
    conectada: conta.conectada,
  };
}

type ClienteDaApi = {
  id: string;
  nome: string;
  tipo: "agencia" | "mandato";
  contas: ContaDaApi[];
};

function paraCliente(cliente: ClienteDaApi): Cliente {
  return {
    id: cliente.id,
    nome: cliente.nome,
    tipo: cliente.tipo,
    contas: cliente.contas.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      usuario: conta.usuario ?? "",
      conectada: conta.conectada,
    })),
  };
}

export async function obterConta(): Promise<Conta> {
  const conta = await requisitar<ContaDaApi | null>("/sessao/conta");
  return { nome: conta?.nome ?? "", usuario: conta?.usuario ?? "" };
}

export function obterResumoDoDia(): Promise<ResumoDoDia> {
  return requisitar<ResumoDoDia>("/resumo-do-dia");
}

export function obterComentarios(
  filtros: FiltrosDeComentarios,
): Promise<PaginaDeComentarios> {
  const faixa = intervalo(filtros.periodo, filtros.intervalo);
  return requisitar<PaginaDeComentarios>(
    `/comentarios${montarConsulta({
      classe: filtros.classe,
      tema: filtros.tema,
      periodo: filtros.periodo,
      de: faixa.de,
      ate: faixa.ate,
      apenasUrgentes: filtros.apenasUrgentes ? "1" : null,
      pagina: filtros.pagina,
    })}`,
  );
}

export function obterDemandas(
  filtros: FiltrosDeDemandas,
): Promise<PainelDeDemandas> {
  const faixa = intervalo(filtros.periodo, filtros.intervalo);
  return requisitar<PainelDeDemandas>(
    `/demandas${montarConsulta({
      categoria: filtros.categoria,
      localidade: filtros.localidade,
      periodo: filtros.periodo,
      de: faixa.de,
      ate: faixa.ate,
      pagina: filtros.pagina,
    })}`,
  );
}

export function obterPerfil(): Promise<Perfil> {
  return requisitar<Perfil>("/perfil");
}

export async function alterarSenha(
  senhaAtual: string,
  novaSenha: string,
): Promise<void> {
  await requisitar<void>("/perfil/senha", {
    metodo: "PATCH",
    corpo: { senhaAtual, novaSenha },
  });
}

export async function entrar(email: string, senha: string): Promise<void> {
  await requisitar<void>("/sessao", { metodo: "POST", corpo: { email, senha } });
}

export async function criarConta(dados: {
  nome: string;
  email: string;
  senha: string;
}): Promise<void> {
  await requisitar<void>("/contas", { metodo: "POST", corpo: dados });
}

export async function solicitarRedefinicao(email: string): Promise<void> {
  await requisitar<void>("/recuperacao", { metodo: "POST", corpo: { email } });
}

export async function redefinirSenha(
  token: string,
  novaSenha: string,
): Promise<void> {
  await requisitar<void>("/recuperacao/confirmar", {
    metodo: "POST",
    corpo: { token, novaSenha },
  });
}

export async function iniciarConexaoComInstagram(): Promise<InicioDeAutorizacao> {
  return requisitar<InicioDeAutorizacao>("/conexoes/instagram", {
    metodo: "POST",
  });
}

/**
 * A volta da autorização acontece no servidor: ele recebe o `code`, troca
 * pelo token e redireciona para cá. Aqui só resta perguntar como ficou.
 */
export async function concluirConexaoComInstagram(
  code: string,
  state: string,
  simular?: MotivoDeErroDeConexao | null,
): Promise<ConexaoDeConta> {
  const conexao = await obterConexaoComInstagram();
  if (!code || !state || code === "recusado") {
    return {
      ...conexao,
      estado: "erro",
      erro: simular ?? "permissao_recusada",
    };
  }
  return conexao;
}

export function obterConexaoComInstagram(): Promise<ConexaoDeConta> {
  return requisitar<ConexaoDeConta>("/conexoes/instagram");
}

export async function desconectarInstagram(): Promise<void> {
  await requisitar<void>("/conexoes/instagram", { metodo: "DELETE" });
}

/** Só existe com dados simulados; na API o estado é o do servidor. */
export async function simularEstadoDaConexao(
  _estado: EstadoDaConexao,
): Promise<ConexaoDeConta> {
  return obterConexaoComInstagram();
}

export async function obterCliente(): Promise<Cliente> {
  return paraCliente(await requisitar<ClienteDaApi>("/cliente"));
}

export async function salvarCliente(cliente: Cliente): Promise<Cliente> {
  const salvo = await requisitar<ClienteDaApi>(`/clientes/${cliente.id}`, {
    metodo: "PATCH",
    corpo: {
      nome: cliente.nome,
      tipo: cliente.tipo,
      contas: cliente.contas.map((conta) => conta.id),
    },
  });
  return paraCliente(salvo);
}

async function contaEmFocoId(): Promise<string> {
  const conta = await requisitar<ContaDaApi | null>("/sessao/conta");
  if (!conta) throw new Error("Nenhuma conta vinculada à sessão.");
  return conta.id;
}

export async function obterConfiguracaoPolitica(): Promise<ConfiguracaoPolitica> {
  const contaId = await contaEmFocoId();
  const politica = await requisitar<ConfiguracaoPolitica>(
    `/contas/${contaId}/politica`,
  );
  return { ...politica, versao: comV(politica.versao) };
}

export async function listarVersoesDaConfiguracao(): Promise<
  VersaoDeConfiguracao[]
> {
  const contaId = await contaEmFocoId();
  const versoes = await requisitar<VersaoDeConfiguracao[]>(
    `/contas/${contaId}/politica/versoes`,
  );
  return versoes.map((versao) => ({ ...versao, versao: comV(versao.versao) }));
}

export async function salvarNovaVersaoDaConfiguracao(
  configuracao: ConfiguracaoPolitica,
): Promise<ConfiguracaoPolitica> {
  const contaId = configuracao.contaId || (await contaEmFocoId());
  const politica = await requisitar<ConfiguracaoPolitica>(
    `/contas/${contaId}/politica`,
    {
      metodo: "POST",
      corpo: {
        alvo: configuracao.alvo,
        cargo: configuracao.cargo,
        escopoDoAlvo: configuracao.escopoDoAlvo,
        partido: {
          sigla: configuracao.partido.sigla,
          numeroDoPartido: configuracao.partido.numeroDoPartido,
          numeroDoCandidato: configuracao.partido.numeroDoCandidato,
        },
        campo: configuracao.campo,
        aliados: configuracao.aliados,
        adversarios: configuracao.adversarios,
        terceirosNaoPoliticos: configuracao.terceirosNaoPoliticos,
        resumo: `Alvo: ${configuracao.alvo}`,
      },
    },
  );
  return { ...politica, versao: comV(politica.versao) };
}

export async function listarContasDaMeta(): Promise<ContaDaMeta[]> {
  return requisitar<ContaDaMeta[]>("/conexoes/instagram/contas");
}

export async function vincularContasDaMeta(ids: string[]): Promise<Cliente> {
  const cliente = await obterCliente();
  const salvo = await requisitar<ClienteDaApi>(`/clientes/${cliente.id}/contas`, {
    metodo: "POST",
    corpo: { ids },
  });
  return paraCliente(salvo);
}

export async function obterContaEmFoco(): Promise<ContaEmFoco> {
  const conta = await requisitar<ContaDaApi | null>("/sessao/conta");
  if (!conta) return { id: "", nome: "", usuario: "", conectada: false };
  return paraConta(conta);
}

export async function listarContasDoCliente(): Promise<ContaEmFoco[]> {
  const contas = await requisitar<ContaDaApi[]>("/sessao/contas");
  return contas.map(paraConta);
}

export async function trocarContaEmFoco(id: string): Promise<ContaEmFoco> {
  return paraConta(
    await requisitar<ContaDaApi>("/sessao/conta", {
      metodo: "PUT",
      corpo: { id },
    }),
  );
}
