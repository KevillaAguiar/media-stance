import { describe, expect, it } from "vitest";
import {
  diasAtras,
  fimDoPeriodo,
  inicioDoPeriodo,
  paginaDeComentarios,
  painelDeDemandas,
  recortarPagina,
} from "./consultas";
import type { Comentario, FiltrosDeComentarios, FiltrosDeDemandas } from "./tipos";

/* O filtro é a interação mais usada do produto e a que quebra em
   silêncio: a tela continua desenhando, só que a lista vem vazia e
   quem está olhando conclui que não há comentário, quando o que houve
   foi um filtro quebrado. */

function comentario(p: Partial<Comentario> & { publicadoEm: string }): Comentario {
  return {
    id: Math.random().toString(36).slice(2),
    texto: "texto inventado",
    classe: "a_favor",
    urgente: false,
    tema: null,
    categoria: null,
    localidade: null,
    urlNaRede: "https://exemplo.invalid/p/1",
    ...p,
  };
}

const FILTROS: FiltrosDeComentarios = {
  classe: null,
  tema: null,
  periodo: "30dias",
  intervalo: null,
  apenasUrgentes: false,
  pagina: 1,
};

const DEMANDAS: FiltrosDeDemandas = {
  categoria: null,
  localidade: null,
  periodo: "30dias",
  intervalo: null,
  pagina: 1,
};

describe("Recorte de período", () => {
  it("traduz cada recorte pronto para um primeiro dia", () => {
    const base = { intervalo: null } as const;
    expect(inicioDoPeriodo({ ...base, periodo: "hoje" })).toBe(diasAtras(0));
    expect(inicioDoPeriodo({ ...base, periodo: "7dias" })).toBe(diasAtras(6));
    expect(inicioDoPeriodo({ ...base, periodo: "30dias" })).toBe(diasAtras(29));
  });

  it("usa o intervalo escolhido quando o período é personalizado", () => {
    const intervalo = { de: "2026-03-01", ate: "2026-03-31" };
    expect(inicioDoPeriodo({ periodo: "personalizado", intervalo })).toBe("2026-03-01");
    expect(fimDoPeriodo({ periodo: "personalizado", intervalo })).toBe("2026-03-31");
  });

  it("cai em hoje quando o personalizado chega sem intervalo", () => {
    // Acontece com `?periodo=personalizado` na URL sem `de` e `ate`.
    // Sem o resguardo, a comparação vira `dia >= undefined` e a lista
    // volta vazia sem ninguém entender por quê.
    expect(inicioDoPeriodo({ periodo: "personalizado", intervalo: null })).toBe(diasAtras(0));
    expect(fimDoPeriodo({ periodo: "personalizado", intervalo: null })).toBe(diasAtras(0));
  });

  it("não quebra com um período que não existe", () => {
    // `?periodo=lixo` na URL. O tipo diz que isso não acontece; a URL
    // não lê o tipo.
    const invalido = { periodo: "lixo", intervalo: null } as never;
    expect(inicioDoPeriodo(invalido)).toBe(diasAtras(29));
    expect(fimDoPeriodo(invalido)).toBe(diasAtras(0));
  });
});

describe("Paginação do resultado", () => {
  const dez = Array.from({ length: 10 }, (_, i) => i);

  it("prende a página pedida ao que existe", () => {
    // `?pagina=99` deixaria a lista vazia e pareceria "nada encontrado".
    expect(recortarPagina(dez, 99).pagina).toBe(2);
    expect(recortarPagina(dez, 99).itens).toHaveLength(5);
    expect(recortarPagina(dez, 0).pagina).toBe(1);
    expect(recortarPagina(dez, -3).pagina).toBe(1);
  });

  it("trata página que não é número como a primeira", () => {
    // `?pagina=abc` vira NaN, e NaN atravessa Math.max e Math.min sem
    // ser corrigido — a lista volta vazia.
    expect(recortarPagina(dez, NaN).pagina).toBe(1);
    expect(recortarPagina(dez, NaN).itens).toHaveLength(5);
  });

  it("sempre tem pelo menos uma página, mesmo sem resultado", () => {
    const vazio = recortarPagina([], 1);
    expect(vazio.totalDePaginas).toBe(1);
    expect(vazio.total).toBe(0);
  });
});

describe("Filtro de comentários", () => {
  const todos: Comentario[] = [
    comentario({ publicadoEm: `${diasAtras(0)}T09:00:00`, classe: "contra", urgente: true, tema: "obras" }),
    comentario({ publicadoEm: `${diasAtras(3)}T09:00:00`, classe: "pedido", tema: "saúde" }),
    comentario({ publicadoEm: `${diasAtras(10)}T09:00:00`, classe: "a_favor", tema: "obras" }),
    comentario({ publicadoEm: `${diasAtras(60)}T09:00:00`, classe: "contra", tema: "obras" }),
  ];

  it("filtra por classe", () => {
    expect(paginaDeComentarios(todos, { ...FILTROS, classe: "contra" }).total).toBe(1);
    expect(paginaDeComentarios(todos, { ...FILTROS, classe: "pedido" }).total).toBe(1);
  });

  it("filtra por tema", () => {
    expect(paginaDeComentarios(todos, { ...FILTROS, tema: "obras" }).total).toBe(2);
  });

  it("filtra por urgência", () => {
    expect(paginaDeComentarios(todos, { ...FILTROS, apenasUrgentes: true }).total).toBe(1);
  });

  it("combina os filtros em vez de trocar um pelo outro", () => {
    const r = paginaDeComentarios(todos, {
      ...FILTROS,
      classe: "contra",
      tema: "obras",
      apenasUrgentes: true,
    });
    expect(r.total).toBe(1);
  });

  it("respeita o recorte de período", () => {
    expect(paginaDeComentarios(todos, { ...FILTROS, periodo: "hoje" }).total).toBe(1);
    expect(paginaDeComentarios(todos, { ...FILTROS, periodo: "7dias" }).total).toBe(2);
    expect(paginaDeComentarios(todos, { ...FILTROS, periodo: "30dias" }).total).toBe(3);
  });

  it("inclui as duas pontas do intervalo personalizado", () => {
    // Intervalo fechado: quem escolhe 1 a 31 de março espera o dia 31.
    const dia = diasAtras(3);
    const r = paginaDeComentarios(todos, {
      ...FILTROS,
      periodo: "personalizado",
      intervalo: { de: dia, ate: dia },
    });
    expect(r.total).toBe(1);
  });

  it("oferece os temas do acervo, não só os da página", () => {
    // Senão o seletor some com um tema assim que ele sai da página 1.
    const r = paginaDeComentarios(todos, { ...FILTROS, classe: "contra" });
    expect(r.temasDisponiveis).toEqual(["obras", "saúde"]);
  });

  it("ordena os temas pelo alfabeto do português", () => {
    const comAcento = [
      comentario({ publicadoEm: `${diasAtras(1)}T09:00:00`, tema: "água" }),
      comentario({ publicadoEm: `${diasAtras(1)}T09:00:00`, tema: "asfalto" }),
      comentario({ publicadoEm: `${diasAtras(1)}T09:00:00`, tema: "zona rural" }),
    ];
    // Ordenar por código de caractere jogaria "água" para o fim.
    expect(paginaDeComentarios(comAcento, FILTROS).temasDisponiveis).toEqual([
      "água",
      "asfalto",
      "zona rural",
    ]);
  });
});

describe("Painel de demandas", () => {
  const todos: Comentario[] = [
    comentario({ publicadoEm: `${diasAtras(1)}T09:00:00`, classe: "pedido", categoria: "Saúde", localidade: "Teresina" }),
    comentario({ publicadoEm: `${diasAtras(2)}T09:00:00`, classe: "pedido", categoria: "Saúde", localidade: "Parnaíba" }),
    comentario({ publicadoEm: `${diasAtras(3)}T09:00:00`, classe: "pedido", categoria: "Infraestrutura", localidade: "Teresina" }),
    comentario({ publicadoEm: `${diasAtras(4)}T09:00:00`, classe: "contra", categoria: "Saúde", localidade: "Teresina" }),
    comentario({ publicadoEm: `${diasAtras(5)}T09:00:00`, classe: "pedido", categoria: null, localidade: "Teresina" }),
  ];

  it("só conta pedido com categoria", () => {
    // O painel existe para encaminhar pedido de eleitor, não para medir
    // oposição — e pedido sem categoria não tem para onde ser agrupado.
    const r = painelDeDemandas(todos, DEMANDAS);
    expect(r.porTema.reduce((s, t) => s + t.quantidade, 0)).toBe(3);
  });

  it("abre na categoria mais volumosa sem ninguém escolher", () => {
    const r = painelDeDemandas(todos, DEMANDAS);
    expect(r.porTema[0].rotulo).toBe("Saúde");
    expect(r.foco.rotulo).toBe("Saúde");
    expect(r.foco.total).toBe(2);
  });

  it("troca o recorte quando a categoria é escolhida", () => {
    const r = painelDeDemandas(todos, { ...DEMANDAS, categoria: "Infraestrutura" });
    expect(r.foco.total).toBe(1);
    expect(r.itens).toHaveLength(1);
  });

  it("cruza categoria e localidade em vez de trocar uma pela outra", () => {
    const r = painelDeDemandas(todos, {
      ...DEMANDAS,
      categoria: "Saúde",
      localidade: "Teresina",
    });
    expect(r.foco.total).toBe(1);
    expect(r.foco.rotulo).toBe("Saúde · Teresina");
  });

  it("ordena as contagens pela quantidade, e empate pelo alfabeto", () => {
    const r = painelDeDemandas(todos, DEMANDAS);
    expect(r.porTema.map((t) => t.rotulo)).toEqual(["Saúde", "Infraestrutura"]);
    expect(r.porLocalidade.map((l) => l.rotulo)).toEqual(["Teresina", "Parnaíba"]);
  });

  it("entrega as categorias para o seletor na mesma resposta", () => {
    expect(painelDeDemandas(todos, DEMANDAS).categoriasDisponiveis).toEqual([
      "Saúde",
      "Infraestrutura",
    ]);
  });

  it("diz 'todas as demandas' quando não há nada no período", () => {
    const r = painelDeDemandas(todos, { ...DEMANDAS, periodo: "hoje" });
    expect(r.foco.rotulo).toBe("Todas as demandas");
    expect(r.foco.total).toBe(0);
    expect(r.totalDePaginas).toBe(1);
  });

  it("respeita o período também aqui", () => {
    const antigo = [
      comentario({ publicadoEm: `${diasAtras(60)}T09:00:00`, classe: "pedido", categoria: "Saúde" }),
    ];
    expect(painelDeDemandas(antigo, DEMANDAS).foco.total).toBe(0);
  });
});
