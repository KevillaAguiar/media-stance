import type { ResumoDoDia } from "./tipos";

/* Dados inventados para desenvolver sem depender do pipeline.
   NENHUM comentário real entra aqui — opinião política é dado pessoal
   sensível pela LGPD, e fixture é arquivo versionado. */

export const resumoDoDia: ResumoDoDia = {
  conta: { nome: "Painel de Comentários", usuario: "@dep.assessoria" },
  data: "2026-09-15",
  classificados: [
    { classe: "a_favor", quantidade: 210, proporcao: 0.6 },
    { classe: "contra", quantidade: 6, proporcao: 0.01 },
    { classe: "pedido", quantidade: 38, proporcao: 0.1 },
    { classe: "neutro", quantidade: 109, proporcao: 0.3 },
  ],
  engajamentoAfetivo: { quantidade: 358, proporcao: 0.49 },
  urgentes: 4,
  publicacaoComMaiorAtrito: {
    id: "pub_exemplo_1",
    legenda: "Hoje estivemos na comunidade Quilombo CEPISA...",
    taxaDeAtrito: 0.082,
    comentarios: 47,
    miniatura: null,
  },
  janelaDias: 7,
  minimoDeComentariosParaTaxa: 20,
};
