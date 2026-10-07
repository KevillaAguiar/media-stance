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
