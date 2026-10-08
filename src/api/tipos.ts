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

export interface Perfil {
  nome: string;
  cargo: string;
  email: string;
  /** Conta do parlamentar que esta pessoa acompanha. */
  contaVinculada: string;
}
