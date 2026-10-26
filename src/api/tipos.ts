/* Contratos da API. Estes tipos são o acordo entre front e back —
   mudança aqui é conversa com quem cuida da integração, não ajuste local. */

/** As cinco classes do codebook. */
export type Classe =
  | "a_favor"
  | "contra"
  | "pedido"
  | "neutro"
  | "engajamento_afetivo";

/** As quatro que entram no cálculo de proporção. */
export type ClasseDePosicionamento = Exclude<Classe, "engajamento_afetivo">;

export interface ContagemPorClasse {
  classe: ClasseDePosicionamento;
  quantidade: number;
  /** 0 a 1. Denominador EXCLUI engajamento afetivo. */
  proporcao: number;
}

export interface PublicacaoComAtrito {
  id: string;
  legenda: string;
  /** 0 a 1. */
  taxaDeAtrito: number;
  comentarios: number;
  miniatura: string | null;
}

export interface Conta {
  nome: string;
  usuario: string;
}

export interface Comentario {
  id: string;
  texto: string;
  classe: ClasseDePosicionamento;
  /** Marcador que acompanha a classe; não é classe do codebook. */
  urgente: boolean;
  /** Rótulo curto do assunto, como aparece no chip da lista. */
  tema: string | null;
  /**
   * Categoria da demanda ("Água e saneamento", "Saúde"). Só os `pedido`
   * carregam: é por ela que o painel de demandas agrupa.
   */
  categoria: string | null;
  /** Localidade citada na demanda, quando identificada. */
  localidade: string | null;
  /** ISO 8601 com hora. */
  publicadoEm: string;
  /**
   * Link para o comentário na rede social. Responder acontece lá, não
   * aqui — está fora do MVP.
   */
  urlNaRede: string;
}

export type RecorteDePeriodo = "hoje" | "7dias" | "30dias" | "personalizado";

/** Intervalo fechado, em datas ISO sem hora. */
export interface Periodo {
  de: string;
  ate: string;
}

export interface FiltrosDeComentarios {
  /** `null` = todas as classes. */
  classe: ClasseDePosicionamento | null;
  /** `null` = todos os temas. */
  tema: string | null;
  periodo: RecorteDePeriodo;
  /** Só quando `periodo` é "personalizado"; `null` nos recortes prontos. */
  intervalo: Periodo | null;
  apenasUrgentes: boolean;
  pagina: number;
}

export interface PaginaDeComentarios {
  itens: Comentario[];
  pagina: number;
  totalDePaginas: number;
  /** Total de comentários que casam com o filtro, não só os desta página. */
  total: number;
  /** Para preencher o seletor de tema sem uma segunda requisição. */
  temasDisponiveis: string[];
}

export interface ResumoDoDia {
  conta: Conta;
  /** ISO 8601, só a data. */
  data: string;
  classificados: ContagemPorClasse[];
  /** Fora do denominador das proporções acima. */
  engajamentoAfetivo: { quantidade: number; proporcao: number };
  /** Comentários que exigem resposta hoje. */
  urgentes: number;
  publicacaoComMaiorAtrito: PublicacaoComAtrito | null;
  /** Parâmetros do cálculo, para as notas de rodapé não ficarem fixas no código. */
  janelaDias: number;
  minimoDeComentariosParaTaxa: number;
}

/* ---- Painel de demandas ---- */

export interface ContagemDeDemanda {
  rotulo: string;
  quantidade: number;
}

export interface FiltrosDeDemandas {
  /** `null` = a categoria mais volumosa do período. */
  categoria: string | null;
  localidade: string | null;
  periodo: RecorteDePeriodo;
  intervalo: Periodo | null;
  pagina: number;
}

export interface PainelDeDemandas {
  porTema: ContagemDeDemanda[];
  porLocalidade: ContagemDeDemanda[];
  /** Recorte em foco, para o título da lista. */
  foco: { rotulo: string; total: number };
  itens: Comentario[];
  pagina: number;
  totalDePaginas: number;
  categoriasDisponiveis: string[];
}

/* ---- Perfil ---- */

/**
 * Quem pode o quê.
 *
 * Dois papéis, não três: um terceiro criaria uma matriz de permissões que
 * ninguém mantém. O assessor lê os comentários; o administrador também
 * cadastra cliente, edita a configuração política e conecta contas.
 *
 * ISTO NÃO PROTEGE NADA. É o que a interface usa para decidir o que
 * desenhar. Quem impede de verdade é o servidor devolvendo 403 — quem
 * digita a URL passa por aqui, e quem chama a API nem precisa do
 * navegador. Mesmo motivo de `src/sessao/` não ser autenticação.
 */
export type PapelDoUsuario = "assessor" | "administrador";

export interface Perfil {
  nome: string;
  cargo: string;
  email: string;
  /** Conta do parlamentar que esta pessoa acompanha. */
  contaVinculada: string;
  papel: PapelDoUsuario;
}

/* ---- Conexão com a conta do Instagram (RF-053, RF-054) ---- */

export type EstadoDaConexao = "ausente" | "conectada" | "expirando" | "erro";

/**
 * Por que o motivo é um código e não uma frase: a mensagem que a pessoa
 * lê muda com o idioma e com o que a gente aprende sobre onde ela trava.
 * Se o servidor mandasse o texto pronto, mudar a redação viraria mudança
 * de servidor.
 */
export type MotivoDeErroDeConexao =
  | "conta_nao_profissional"
  | "sem_pagina_vinculada"
  | "permissao_recusada"
  | "state_invalido"
  | "token_expirado"
  | "falha_do_provedor";

export interface ConexaoDeConta {
  estado: EstadoDaConexao;
  /** `@usuario` da conta conectada; `null` quando não há conexão. */
  usuario: string | null;
  /** ISO 8601 só a data. */
  expiraEm: string | null;
  /**
   * Quem decide se é "expirando" é o servidor, não a tela. Se a regra
   * vivesse nos dois lugares, uma hora elas divergiriam e o alerta do
   * RF-016 apareceria num lugar e não no outro.
   */
  diasParaExpirar: number | null;
  erro: MotivoDeErroDeConexao | null;
  /* RF-054: registro de quem autorizou, quando e o quê. */
  autorizadaPor: string | null;
  autorizadaEm: string | null;
  permissoes: string[];
}

export interface InicioDeAutorizacao {
  /** Para onde mandar a pessoa. Quem monta é o servidor. */
  urlDeAutorizacao: string;
}

/* ---- Cadastro de cliente (RF-001 a RF-005) ---- */

export type TipoDeCliente = "agencia" | "mandato";

export interface ContaVinculada {
  id: string;
  nome: string;
  usuario: string;
  /** Reflete o estado da conexão com a Meta, não um campo editável. */
  conectada: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  tipo: TipoDeCliente;
  contas: ContaVinculada[];
}

/* ---- Configuração política (RD-016, RN-020) ---- */

export interface Partido {
  sigla: string;
  numeroDoPartido: string;
  numeroDoCandidato: string;
}

/**
 * A tabela de alinhamento que entra no prompt do modelo.
 *
 * Os nomes dos campos seguem o `config_politico.json` do pipeline de
 * propósito: são a mesma coisa, e inventar um segundo vocabulário aqui
 * criaria uma tradução para alguém manter.
 */
export interface ConfiguracaoPolitica {
  contaId: string;
  versao: string;
  atualizadaEm: string;
  atualizadaPor: string;
  alvo: string;
  cargo: string;
  escopoDoAlvo: string;
  partido: Partido;
  campo: string;
  aliados: string[];
  adversarios: string[];
  terceirosNaoPoliticos: string[];
  /** O que ainda não foi confirmado com o cliente; `null` quando nada falta. */
  pendenteDeConfirmacao: string | null;
}

export interface VersaoDeConfiguracao {
  versao: string;
  criadaEm: string;
  criadaPor: string;
  resumo: string;
  vigente: boolean;
}
