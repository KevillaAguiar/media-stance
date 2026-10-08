import type { ResumoDoDia } from "./tipos";

/* Dados inventados para desenvolver sem depender do pipeline.
   NENHUM comentário real entra aqui — opinião política é dado pessoal
   sensível pela LGPD, e fixture é arquivo versionado. */

/** Data de hoje no fuso local, como "AAAA-MM-DD". */
function hoje(): string {
  const agora = new Date();
  // Montada campo a campo de propósito: `toISOString()` devolve UTC, e às
  // 21h em São Paulo o UTC já virou o dia seguinte — o painel mostraria
  // amanhã.
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export function resumoDoDia(): ResumoDoDia {
  return {
    conta: { nome: "Painel de Comentários", usuario: "@dep.assessoria" },
    data: hoje(),
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
}
