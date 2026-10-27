/* Base de demonstração.
   ---------------------------------------------------------------------
   Lê o resultado real da classificação e serve as telas com ele, sem
   servidor. É o caminho da apresentação de 12/11: o sistema mostra
   números de verdade, apurados pela nossa rodada, em vez de exemplos
   inventados.

   O ARQUIVO DE DADOS NÃO MORA NO REPOSITÓRIO, e não é por organização.
   Ele carrega comentário real de pessoa identificável — opinião política
   é dado pessoal sensível pelo art. 5º, II da LGPD — e este repositório
   é público. Ele é gerado localmente por `gerar_base_demo.py` e fica
   FORA da pasta do projeto; o servidor de desenvolvimento o entrega a
   partir do caminho apontado por `BASE_DEMO`, sem nunca copiá-lo para
   dentro. Ver `src/api/LEIA-ME-base-demo.md`.

   Quando a API real existir, este arquivo sai inteiro: as telas passam a
   perguntar ao servidor, e o filtro deixa de ser trabalho do navegador. */

import {
  painelDeDemandas as consultarDemandas,
  paginaDeComentarios as consultarComentarios,
  hoje,
} from "./consultas";
import type {
  Comentario,
  Conta,
  ContaEmFoco,
  ContagemPorClasse,
  FiltrosDeComentarios,
  FiltrosDeDemandas,
  PaginaDeComentarios,
  PainelDeDemandas,
  PublicacaoComAtrito,
  ResumoDoDia,
} from "./tipos";

/** O caminho que o servidor de desenvolvimento expõe (ver vite.config.ts). */
const ENDERECO = "/__base-demo.json";

export const JANELA_DIAS = 7;
export const MINIMO_PARA_TAXA = 20;

interface ContaDaBase {
  conta: Conta;
  partido: { sigla: string; numero_partido: string; numero_candidato: string };
  classificados: ContagemPorClasse[];
  engajamentoAfetivo: { quantidade: number; proporcao: number };
  comentarios: Comentario[];
  publicacoes: {
    id: string;
    legenda: string;
    comentarios: number;
    contra: number;
    permalink: string;
  }[];
}

export interface BaseDeDemonstracao {
  geradoEm: string;
  origem: {
    corpus: string;
    modelo: string;
    comentarios: number;
    periodoReal: { de: string | null; ate: string | null };
    /** Qual dia do corpus a base está chamando de hoje. */
    diaDoCorpusComoHoje: string;
    deslocamentoEmDias: number;
    regraDoNumeroDoPartido: {
      decididaEm: string;
      comentariosAfetados: Record<string, number>;
    };
  };
  porConta: Record<string, ContaDaBase>;
}

let carregada: Promise<BaseDeDemonstracao> | null = null;

/**
 * Busca a base uma vez e reaproveita.
 *
 * São alguns megabytes: buscar a cada navegação deixaria a demonstração
 * ao vivo lenta justamente nas trocas de tela, que é quando alguém está
 * olhando.
 */
export function base(): Promise<BaseDeDemonstracao> {
  carregada ??= fetch(ENDERECO).then((r) => {
    if (!r.ok) {
      throw new Error(
        "Base de demonstração não encontrada. Gere com `gerar_base_demo.py` " +
          "e aponte BASE_DEMO para o arquivo. Ver src/api/LEIA-ME-base-demo.md.",
      );
    }
    return r.json() as Promise<BaseDeDemonstracao>;
  });
  return carregada;
}

let emFoco: string | null = null;

/** Só para teste: esquece a base e a conta em foco derivada dela. */
export function esquecerBase(): void {
  carregada = null;
  // Esquecer a base e manter o foco deixaria um id da base anterior
  // apontando para uma conta que pode não existir na nova.
  emFoco = null;
}

async function contaAtual(): Promise<[string, ContaDaBase]> {
  const b = await base();
  const ids = Object.keys(b.porConta);
  const id = emFoco && ids.includes(emFoco) ? emFoco : ids[0];
  return [id, b.porConta[id]];
}

export async function conta(): Promise<Conta> {
  return (await contaAtual())[1].conta;
}

export async function contas(): Promise<ContaEmFoco[]> {
  const b = await base();
  return Object.entries(b.porConta).map(([id, c]) => ({
    id,
    nome: c.conta.nome,
    usuario: c.conta.usuario,
    conectada: true,
  }));
}

export async function foco(): Promise<ContaEmFoco> {
  const [id, c] = await contaAtual();
  return { id, nome: c.conta.nome, usuario: c.conta.usuario, conectada: true };
}

export async function trocarFoco(id: string): Promise<ContaEmFoco> {
  const b = await base();
  if (b.porConta[id]) emFoco = id;
  return foco();
}

/**
 * A publicação com mais atrito na janela.
 *
 * O mínimo de comentários não é capricho: uma publicação com 3
 * comentários e 1 crítica marca 33% e lidera o ranking sem significar
 * nada. Abaixo do mínimo, a taxa não é reportada — mesma regra do
 * relatório por e-mail, para os dois dizerem a mesma coisa.
 */
function maiorAtrito(c: ContaDaBase): PublicacaoComAtrito | null {
  const elegiveis = c.publicacoes.filter(
    (p) => p.comentarios >= MINIMO_PARA_TAXA,
  );
  if (elegiveis.length === 0) return null;

  const campea = elegiveis.reduce((a, b) =>
    b.contra / b.comentarios > a.contra / a.comentarios ? b : a,
  );

  return {
    id: campea.id,
    legenda: campea.legenda,
    taxaDeAtrito: campea.contra / campea.comentarios,
    comentarios: campea.comentarios,
    miniatura: null,
  };
}

export async function resumoDoDia(): Promise<ResumoDoDia> {
  const [, c] = await contaAtual();
  return {
    conta: c.conta,
    data: hoje(),
    classificados: c.classificados,
    engajamentoAfetivo: c.engajamentoAfetivo,
    // Urgente é o que exige resposta HOJE, não na janela inteira.
    urgentes: c.comentarios.filter(
      (x) => x.urgente && x.publicadoEm.slice(0, 10) === hoje(),
    ).length,
    publicacaoComMaiorAtrito: maiorAtrito(c),
    janelaDias: JANELA_DIAS,
    minimoDeComentariosParaTaxa: MINIMO_PARA_TAXA,
  };
}

export async function paginaDeComentarios(
  filtros: FiltrosDeComentarios,
): Promise<PaginaDeComentarios> {
  const [, c] = await contaAtual();
  return consultarComentarios(c.comentarios, filtros);
}

export async function painelDeDemandas(
  filtros: FiltrosDeDemandas,
): Promise<PainelDeDemandas> {
  const [, c] = await contaAtual();
  return consultarDemandas(c.comentarios, filtros);
}

/** A procedência, para o rodapé dizer de onde vieram os números. */
export async function procedencia(): Promise<BaseDeDemonstracao["origem"]> {
  return (await base()).origem;
}
