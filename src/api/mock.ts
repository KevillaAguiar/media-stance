import {
  diasAtras,
  hoje,
  painelDeDemandas as consultarDemandas,
  paginaDeComentarios as consultarComentarios,
} from "./consultas";
import type {
  Cliente,
  Comentario,
  ConexaoDeConta,
  ConfiguracaoPolitica,
  ContaDaMeta,
  ContaEmFoco,
  EstadoDaConexao,
  MotivoDeErroDeConexao,
  FiltrosDeComentarios,
  FiltrosDeDemandas,
  PaginaDeComentarios,
  PainelDeDemandas,
  Perfil,
  ResumoDoDia,
  VersaoDeConfiguracao,
} from "./tipos";

/* Dados inventados para desenvolver sem depender do pipeline.
   NENHUM comentário real entra aqui — opinião política é dado pessoal
   sensível pela LGPD, e fixture é arquivo versionado. */

/** Data de hoje no fuso local, como "AAAA-MM-DD". */


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

export function paginaDeComentarios(
  filtros: FiltrosDeComentarios,
): PaginaDeComentarios {
  return consultarComentarios(todosOsComentarios(), filtros);
}

export function painelDeDemandas(filtros: FiltrosDeDemandas): PainelDeDemandas {
  return consultarDemandas(todosOsComentarios(), filtros);
}

/* ---- Perfil ---- */

export const perfil: Perfil = {
  nome: "Nome do Assessor",
  cargo: "Assessor de Comunicação",
  email: "assessor@dep.gov.br",
  contaVinculada: "@dep.assessoria",
  // Administrador no mock para as telas de configuração aparecerem.
  papel: "administrador",
};

/* ---- Conexão com a conta do Instagram ----------------------------------
   Estado em memória, só para o fluxo poder ser percorrido inteiro sem
   servidor. Some a cada recarga de página, e isso é proposital: a
   conexão de verdade vive no banco, não aqui. */

let conexao: ConexaoDeConta = {
  estado: "ausente",
  usuario: null,
  expiraEm: null,
  diasParaExpirar: null,
  erro: null,
  autorizadaPor: null,
  autorizadaEm: null,
  permissoes: [],
};

export function conexaoAtual(): ConexaoDeConta {
  return { ...conexao };
}

/** Data de N dias à frente, como "AAAA-MM-DD". */
function daquiA(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function conectar(motivoSimulado: MotivoDeErroDeConexao | null): ConexaoDeConta {
  if (motivoSimulado) {
    conexao = { ...conexao, estado: "erro", erro: motivoSimulado };
    return conexaoAtual();
  }

  // 60 dias é a validade do token longo da Meta.
  const dias = 60;
  conexao = {
    estado: "conectada",
    usuario: perfil.contaVinculada,
    expiraEm: daquiA(dias),
    diasParaExpirar: dias,
    erro: null,
    autorizadaPor: perfil.email,
    autorizadaEm: new Date().toISOString(),
    permissoes: [
      "instagram_basic",
      "instagram_manage_comments",
      "pages_show_list",
      "pages_read_engagement",
    ],
  };
  return conexaoAtual();
}

export function desconectar(): void {
  conexao = {
    estado: "ausente",
    usuario: null,
    expiraEm: null,
    diasParaExpirar: null,
    erro: null,
    autorizadaPor: null,
    autorizadaEm: null,
    permissoes: [],
  };
}

/**
 * Força um estado, para a demonstração poder mostrar cada caso sem
 * esperar 53 dias nem quebrar a conta de propósito.
 */
export function forcarEstado(estado: EstadoDaConexao): ConexaoDeConta {
  if (estado === "conectada") return conectar(null);
  if (estado === "ausente") {
    desconectar();
    return conexaoAtual();
  }
  if (estado === "expirando") {
    conectar(null);
    conexao = { ...conexao, estado: "expirando", expiraEm: daquiA(5), diasParaExpirar: 5 };
    return conexaoAtual();
  }
  conexao = { ...conexao, estado: "erro", erro: "token_expirado" };
  return conexaoAtual();
}

/* ---- Cliente e configuração política -----------------------------------
   Estado em memória, como a conexão. Os valores reproduzem a forma do
   config_politico.json do pipeline, com as duas contas do projeto. */

let cliente: Cliente = {
  id: "cli_1",
  nome: "Mandato Dep. Limma",
  tipo: "mandato",
  contas: [
    { id: "conta_limma", nome: "Deputado Limma", usuario: "@dep.limma", conectada: true },
    { id: "conta_elzuila", nome: "Deputada Elzuila", usuario: "@dep.elzuila", conectada: false },
  ],
};

export function clienteAtual(): Cliente {
  return { ...cliente, contas: cliente.contas.map((c) => ({ ...c })) };
}

export function salvarCliente(novo: Cliente): Cliente {
  cliente = { ...novo, contas: novo.contas.map((c) => ({ ...c })) };
  return clienteAtual();
}

const POLITICA_INICIAL: ConfiguracaoPolitica = {
  contaId: "conta_limma",
  versao: "v1.0",
  atualizadaEm: "2026-09-19",
  atualizadaPor: "assessor@dep.gov.br",
  alvo: "Limma",
  cargo: "Deputado estadual — Piauí",
  escopoDoAlvo: "Atitude em relação ao titular e sua atuação pública",
  partido: { sigla: "PT", numeroDoPartido: "13", numeroDoCandidato: "13123" },
  campo: 'Coligação do governo do Piauí — campo Lula / Rafael Fonteles, "time do povo"',
  aliados: [
    "Lula", "Rafael Fonteles", "Wellington Dias", "Merlong Solano",
    "Marcelo Castro", "Júlio César", "Assis Carvalho", "Elvis Ramos",
    "PT", "Partido dos Trabalhadores", "time do povo", "governo do Piauí",
  ],
  adversarios: ["Jair Bolsonaro", "Flávio Bolsonaro", "bolsonarismo", "direita", "extrema-direita"],
  terceirosNaoPoliticos: ["Rejane Tavares", "dona Nita", "João Tomaz", "Socorrinha"],
  pendenteDeConfirmacao:
    "Adversários de nível estadual ainda não foram confirmados com o mandato.",
};

let politica: ConfiguracaoPolitica = { ...POLITICA_INICIAL };

let versoes: VersaoDeConfiguracao[] = [
  { versao: "v1.0", criadaEm: "2026-09-19", criadaPor: "assessor@dep.gov.br",
    resumo: "Versão inicial, derivada das legendas das publicações.", vigente: true },
  { versao: "v0.2", criadaEm: "2026-09-12", criadaPor: "assessor@dep.gov.br",
    resumo: "Acrescentados 4 terceiros não políticos.", vigente: false },
  { versao: "v0.1", criadaEm: "2026-09-05", criadaPor: "assessor@dep.gov.br",
    resumo: "Rascunho com partido e aliados nacionais.", vigente: false },
];

export function politicaAtual(): ConfiguracaoPolitica {
  return JSON.parse(JSON.stringify(politica));
}

export function versoesDaPolitica(): VersaoDeConfiguracao[] {
  return versoes.map((v) => ({ ...v }));
}

/** Soma 0.1 ao número menor: v1.0 vira v1.1, v1.9 vira v1.10. */
export function proximaVersao(atual: string): string {
  const [maior, menor] = atual.replace(/^v/, "").split(".").map(Number);
  return `v${maior}.${(menor ?? 0) + 1}`;
}

/**
 * Nunca sobrescreve: cria uma versão nova e empurra a anterior para o
 * histórico. É o que mantém `politica_versao` significando alguma coisa
 * num resultado carimbado meses atrás.
 */
export function salvarNovaVersao(nova: ConfiguracaoPolitica): ConfiguracaoPolitica {
  const versao = proximaVersao(politica.versao);
  const hoje = new Date().toISOString().slice(0, 10);

  versoes = [
    { versao, criadaEm: hoje, criadaPor: perfil.email,
      resumo: "Alteração feita pela tela de configuração política.", vigente: true },
    ...versoes.map((v) => ({ ...v, vigente: false })),
  ];

  politica = { ...nova, versao, atualizadaEm: hoje, atualizadaPor: perfil.email };
  return politicaAtual();
}

/* ---- Contas da Meta e conta em foco ---- */

/** O que a Meta devolveria em /me/accounts depois da autorização. */
export function contasDaMeta(): ContaDaMeta[] {
  const vinculadas = new Set(cliente.contas.map((c) => c.usuario));
  return [
    { id: "ig_limma", nome: "Deputado Limma", usuario: "@dep.limma",
      pagina: "Dep. Limma", jaVinculada: vinculadas.has("@dep.limma"), impedimento: null },
    { id: "ig_elzuila", nome: "Deputada Elzuila", usuario: "@dep.elzuila",
      pagina: "Elzuila Oficial", jaVinculada: vinculadas.has("@dep.elzuila"), impedimento: null },
    { id: "ig_limma_noticias", nome: "Limma Notícias", usuario: "@limma.noticias",
      pagina: "Limma Notícias", jaVinculada: vinculadas.has("@limma.noticias"),
      impedimento: null },
    { id: null, nome: "Gabinete Limma", usuario: null, pagina: "Gabinete Limma",
      jaVinculada: false,
      impedimento: "Página sem conta do Instagram vinculada" },
  ];
}

export function vincularContasDaMeta(ids: string[]): Cliente {
  const disponiveis = contasDaMeta();
  for (const id of ids) {
    const m = disponiveis.find((c) => c.id === id);
    if (!m || !m.usuario || m.jaVinculada) continue;
    cliente = {
      ...cliente,
      contas: [...cliente.contas,
        { id: m.id!, nome: m.nome, usuario: m.usuario, conectada: true }],
    };
  }
  return clienteAtual();
}

let contaEmFoco = "conta_limma";

export function focoAtual(): ContaEmFoco {
  const c = cliente.contas.find((x) => x.id === contaEmFoco) ?? cliente.contas[0];
  return { id: c.id, nome: c.nome, usuario: c.usuario, conectada: c.conectada };
}

export function trocarFoco(id: string): ContaEmFoco {
  if (cliente.contas.some((c) => c.id === id)) contaEmFoco = id;
  return focoAtual();
}

export function contasDoCliente(): ContaEmFoco[] {
  return cliente.contas.map((c) => ({
    id: c.id, nome: c.nome, usuario: c.usuario, conectada: c.conectada,
  }));
}
