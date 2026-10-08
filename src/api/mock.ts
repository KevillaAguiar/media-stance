import type {
  Comentario,
  ContagemDeDemanda,
  FiltrosDeComentarios,
  FiltrosDeDemandas,
  PaginaDeComentarios,
  PainelDeDemandas,
  Perfil,
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
    categoria: null,
    localidade: null,
    hora: "08:12",
    urlNaRede: "https://www.instagram.com/p/exemplo-1/",
  },
  {
    texto: "Quero que venha no nosso Quilombo CEPISA",
    classe: "pedido",
    urgente: false,
    tema: "visita Quilombo CEPISA",
    categoria: "Infraestrutura vicinal",
    localidade: "Quilombo CEPISA",
    hora: "09:47",
    urlNaRede: "https://www.instagram.com/p/exemplo-2/",
  },
  {
    texto: "Teria vergonha de falar desse projeto, ainda dá tempo de apagar",
    classe: "contra",
    urgente: false,
    tema: "crítica projeto",
    categoria: null,
    localidade: null,
    hora: "10:03",
    urlNaRede: "https://www.instagram.com/p/exemplo-3/",
  },
  {
    texto:
      "Eu e minha vizinhança estamos lutando por água na nossa comunidade, já mandamos 3 mensagens e nada",
    classe: "pedido",
    urgente: true,
    tema: "água comunidade",
    categoria: "Água e saneamento",
    localidade: "Comunidade Aldeia",
    hora: "11:20",
    urlNaRede: "https://www.instagram.com/p/exemplo-4/",
  },
  {
    texto: "Fora petralhas",
    classe: "contra",
    urgente: false,
    tema: "crítica partidária",
    categoria: null,
    localidade: null,
    hora: "12:05",
    urlNaRede: "https://www.instagram.com/p/exemplo-5/",
  },
  {
    texto: "A escola do meu bairro está sem professor de matemática há 2 meses",
    classe: "pedido",
    urgente: true,
    tema: "escola sem professor",
    categoria: "Educação",
    localidade: "Oeiras",
    hora: "13:31",
    urlNaRede: "https://www.instagram.com/p/exemplo-6/",
  },
  {
    texto: "Parabéns pela coragem, pena que só na véspera da eleição",
    classe: "contra",
    urgente: false,
    tema: "crítica oportunismo",
    categoria: null,
    localidade: null,
    hora: "14:08",
    urlNaRede: "https://www.instagram.com/p/exemplo-7/",
  },
  {
    texto: "O posto de saúde daqui fechou e ninguém avisou a população",
    classe: "pedido",
    urgente: false,
    tema: "posto de saúde",
    categoria: "Saúde",
    localidade: "Bairro Centro",
    hora: "15:44",
    urlNaRede: "https://www.instagram.com/p/exemplo-8/",
  },
  {
    texto: "Quero esse projeto e fazer uma barragem na nossa aldeia",
    classe: "pedido",
    urgente: false,
    tema: "barragem aldeia",
    categoria: "Água e saneamento",
    localidade: "Comunidade Aldeia",
    hora: "14:02",
    urlNaRede: "https://www.instagram.com/p/exemplo-9/",
  },
  {
    texto: "Precisamos de poço aqui na zona rural, já faz meses",
    classe: "pedido",
    urgente: false,
    tema: "poço zona rural",
    categoria: "Água e saneamento",
    localidade: "Zona rural",
    hora: "15:40",
    urlNaRede: "https://www.instagram.com/p/exemplo-10/",
  },
  {
    texto: "A estrada que liga o povoado está intransitável desde a chuva",
    classe: "pedido",
    urgente: true,
    tema: "estrada povoado",
    categoria: "Infraestrutura vicinal",
    localidade: "Zona rural",
    hora: "08:55",
    urlNaRede: "https://www.instagram.com/p/exemplo-11/",
  },
  {
    texto: "Falta iluminação na praça, já teve assalto três vezes esse mês",
    classe: "pedido",
    urgente: true,
    tema: "iluminação praça",
    categoria: "Segurança",
    localidade: "Bairro Centro",
    hora: "19:12",
    urlNaRede: "https://www.instagram.com/p/exemplo-12/",
  },
  {
    texto: "O esgoto corre a céu aberto na rua de trás da escola",
    classe: "pedido",
    urgente: true,
    tema: "esgoto a céu aberto",
    categoria: "Água e saneamento",
    localidade: "Oeiras",
    hora: "10:28",
    urlNaRede: "https://www.instagram.com/p/exemplo-13/",
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

/* ---- Painel de demandas ---------------------------------------------
   Demanda é comentário da classe `pedido` com categoria identificada.
   As outras classes não entram: o painel existe para encaminhar pedido
   de eleitor, não para medir oposição. */

function contar(
  itens: Comentario[],
  campo: "categoria" | "localidade",
): ContagemDeDemanda[] {
  const mapa = new Map<string, number>();
  for (const item of itens) {
    const valor = item[campo];
    if (valor) mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([rotulo, quantidade]) => ({ rotulo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

export function painelDeDemandas(filtros: FiltrosDeDemandas): PainelDeDemandas {
  const de =
    filtros.periodo === "personalizado"
      ? (filtros.intervalo?.de ?? diasAtras(0))
      : diasAtras(filtros.periodo === "hoje" ? 0 : filtros.periodo === "7dias" ? 6 : 29);
  const ate =
    filtros.periodo === "personalizado"
      ? (filtros.intervalo?.ate ?? diasAtras(0))
      : diasAtras(0);

  const noPeriodo = todosOsComentarios().filter((c) => {
    const dia = c.publicadoEm.slice(0, 10);
    return c.classe === "pedido" && c.categoria !== null && dia >= de && dia <= ate;
  });

  const porTema = contar(noPeriodo, "categoria");
  const porLocalidade = contar(noPeriodo, "localidade");

  // Sem escolha do usuário, a lista abre na categoria mais volumosa: é a
  // que a assessoria vai querer ver primeiro.
  const categoria = filtros.categoria ?? porTema[0]?.rotulo ?? null;

  const emFoco = noPeriodo.filter(
    (c) =>
      (categoria === null || c.categoria === categoria) &&
      (filtros.localidade === null || c.localidade === filtros.localidade),
  );

  const totalDePaginas = Math.max(1, Math.ceil(emFoco.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, filtros.pagina), totalDePaginas);
  const inicio = (pagina - 1) * POR_PAGINA;

  const rotulo = [categoria, filtros.localidade].filter(Boolean).join(" · ");

  return {
    porTema,
    porLocalidade,
    foco: { rotulo: rotulo || "Todas as demandas", total: emFoco.length },
    itens: emFoco.slice(inicio, inicio + POR_PAGINA),
    pagina,
    totalDePaginas,
    categoriasDisponiveis: porTema.map((t) => t.rotulo),
  };
}

/* ---- Perfil ---- */

export const perfil: Perfil = {
  nome: "Nome do Assessor",
  cargo: "Assessor de Comunicação",
  email: "assessor@dep.gov.br",
  contaVinculada: "@dep.assessoria",
};
