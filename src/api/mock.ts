import type {
  Comentario,
  FiltrosDeComentarios,
  PaginaDeComentarios,
  ResumoDoDia,
} from "./tipos";

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

/* ---- Comentários ----------------------------------------------------
   Exemplos inventados. Nenhum comentário real de rede social entra aqui:
   opinião política é dado pessoal sensível pela LGPD e este arquivo é
   versionado. */

type Semente = Omit<Comentario, "id" | "publicadoEm"> & { hora: string };

const SEMENTES: Semente[] = [
  {
    texto: "Prometeu e até hoje nada. Quando vai cumprir?",
    classe: "contra",
    urgente: true,
    tema: "cobrança promessa",
    hora: "08:12",
    urlNaRede: "https://www.instagram.com/p/exemplo-1/",
  },
  {
    texto: "Quero que venha no nosso Quilombo CEPISA",
    classe: "pedido",
    urgente: false,
    tema: "visita Quilombo CEPISA",
    hora: "09:47",
    urlNaRede: "https://www.instagram.com/p/exemplo-2/",
  },
  {
    texto: "Teria vergonha de falar desse projeto, ainda dá tempo de apagar",
    classe: "contra",
    urgente: false,
    tema: "crítica projeto",
    hora: "10:03",
    urlNaRede: "https://www.instagram.com/p/exemplo-3/",
  },
  {
    texto:
      "Eu e minha vizinhança estamos lutando por água na nossa comunidade, já mandamos 3 mensagens e nada",
    classe: "pedido",
    urgente: true,
    tema: "água comunidade",
    hora: "11:20",
    urlNaRede: "https://www.instagram.com/p/exemplo-4/",
  },
  {
    texto: "Fora petralhas",
    classe: "contra",
    urgente: false,
    tema: "crítica partidária",
    hora: "12:05",
    urlNaRede: "https://www.instagram.com/p/exemplo-5/",
  },
  {
    texto: "A escola do meu bairro está sem professor de matemática há 2 meses",
    classe: "pedido",
    urgente: true,
    tema: "escola sem professor",
    hora: "13:31",
    urlNaRede: "https://www.instagram.com/p/exemplo-6/",
  },
  {
    texto: "Parabéns pela coragem, pena que só na véspera da eleição",
    classe: "contra",
    urgente: false,
    tema: "crítica oportunismo",
    hora: "14:08",
    urlNaRede: "https://www.instagram.com/p/exemplo-7/",
  },
  {
    texto: "O posto de saúde daqui fechou e ninguém avisou a população",
    classe: "pedido",
    urgente: false,
    tema: "posto de saúde",
    hora: "15:44",
    urlNaRede: "https://www.instagram.com/p/exemplo-8/",
  },
];

/** Data de N dias atrás, como "AAAA-MM-DD". */
function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Espalha os comentários pelos últimos 45 dias, com volume variável por
 * dia. Concentrar tudo em hoje faria o filtro de período parecer
 * funcionar sem nunca mudar um resultado.
 */
function todosOsComentarios(): Comentario[] {
  const itens: Comentario[] = [];
  let n = 0;

  for (let atras = 0; atras < 45; atras++) {
    const dia = diasAtras(atras);
    // 3 a 6 por dia, variando de forma determinística para que a lista
    // não dance a cada render.
    const quantos = 3 + ((atras * 7) % 4);

    for (let i = 0; i < quantos; i++) {
      const { hora, ...resto } = SEMENTES[(n + atras) % SEMENTES.length];
      itens.push({
        ...resto,
        id: `cmt_${String(++n).padStart(3, "0")}`,
        publicadoEm: `${dia}T${hora}:00`,
      });
    }
  }

  return itens;
}

const POR_PAGINA = 5;

/** Primeiro dia incluído no recorte, como "AAAA-MM-DD". */
function inicioDoPeriodo(filtros: FiltrosDeComentarios): string {
  switch (filtros.periodo) {
    case "hoje":
      return diasAtras(0);
    case "7dias":
      return diasAtras(6);
    case "30dias":
      return diasAtras(29);
    case "personalizado":
      return filtros.intervalo?.de ?? diasAtras(0);
  }
}

function fimDoPeriodo(filtros: FiltrosDeComentarios): string {
  return filtros.periodo === "personalizado"
    ? (filtros.intervalo?.ate ?? diasAtras(0))
    : diasAtras(0);
}

export function paginaDeComentarios(
  filtros: FiltrosDeComentarios,
): PaginaDeComentarios {
  const todos = todosOsComentarios();
  const de = inicioDoPeriodo(filtros);
  const ate = fimDoPeriodo(filtros);

  const casam = todos.filter((c) => {
    // Comparação de texto funciona porque "AAAA-MM-DD" ordena como data.
    const dia = c.publicadoEm.slice(0, 10);
    return (
      dia >= de &&
      dia <= ate &&
      (filtros.classe === null || c.classe === filtros.classe) &&
      (filtros.tema === null || c.tema === filtros.tema) &&
      (!filtros.apenasUrgentes || c.urgente)
    );
  });

  const totalDePaginas = Math.max(1, Math.ceil(casam.length / POR_PAGINA));
  // Protege contra ?pagina=99 na URL, que deixaria a lista vazia sem motivo.
  const pagina = Math.min(Math.max(1, filtros.pagina), totalDePaginas);
  const inicio = (pagina - 1) * POR_PAGINA;

  return {
    itens: casam.slice(inicio, inicio + POR_PAGINA),
    pagina,
    totalDePaginas,
    total: casam.length,
    temasDisponiveis: [
      ...new Set(todos.map((c) => c.tema).filter((t): t is string => t !== null)),
    ].sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}
