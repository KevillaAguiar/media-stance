/* Filtro, recorte de período e paginação.
   ---------------------------------------------------------------------
   Vive aqui, e não dentro do mock, porque as mesmas regras valem para os
   dados inventados e para a base de demonstração. Duas cópias do mesmo
   filtro divergem na primeira correção que alguém fizer só num lado — e
   aí a demonstração mostra um número e o desenvolvimento mostra outro.

   Quando o servidor existir, este arquivo some: filtrar e paginar passam
   a ser consulta ao banco, não trabalho do navegador. O que precisa
   sobreviver é o SIGNIFICADO de cada regra, e é isso que está comentado
   abaixo. */

import type {
  Comentario,
  ContagemDeDemanda,
  FiltrosDeComentarios,
  FiltrosDeDemandas,
  PaginaDeComentarios,
  PainelDeDemandas,
} from "./tipos";

export const POR_PAGINA = 5;

/**
 * A data de hoje, montada campo a campo.
 *
 * `toISOString()` devolve UTC, e às 21h em São Paulo o UTC já virou o dia
 * seguinte — o painel mostraria amanhã.
 */
export function hoje(): string {
  return diasAtras(0);
}

export function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Primeiro dia incluído no recorte, como "AAAA-MM-DD". */
export function inicioDoPeriodo(
  filtros: Pick<FiltrosDeComentarios, "periodo" | "intervalo">,
): string {
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

export function fimDoPeriodo(
  filtros: Pick<FiltrosDeComentarios, "periodo" | "intervalo">,
): string {
  return filtros.periodo === "personalizado"
    ? (filtros.intervalo?.ate ?? diasAtras(0))
    : diasAtras(0);
}

/**
 * Prende a página pedida ao intervalo que existe.
 *
 * Protege contra `?pagina=99` na URL, que deixaria a lista vazia sem
 * motivo aparente — a pessoa veria "nenhum comentário" e concluiria que
 * o filtro não achou nada, quando o que houve foi uma página inexistente.
 */
export function recortarPagina<T>(
  itens: T[],
  pedida: number,
): { itens: T[]; pagina: number; totalDePaginas: number; total: number } {
  const totalDePaginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, pedida), totalDePaginas);
  const inicio = (pagina - 1) * POR_PAGINA;
  return {
    itens: itens.slice(inicio, inicio + POR_PAGINA),
    pagina,
    totalDePaginas,
    total: itens.length,
  };
}

export function paginaDeComentarios(
  todos: Comentario[],
  filtros: FiltrosDeComentarios,
): PaginaDeComentarios {
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

  return {
    ...recortarPagina(casam, filtros.pagina),
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
    .sort(
      (a, b) =>
        b.quantidade - a.quantidade || a.rotulo.localeCompare(b.rotulo, "pt-BR"),
    );
}

export function painelDeDemandas(
  todos: Comentario[],
  filtros: FiltrosDeDemandas,
): PainelDeDemandas {
  const de = inicioDoPeriodo(filtros);
  const ate = fimDoPeriodo(filtros);

  const noPeriodo = todos.filter((c) => {
    const dia = c.publicadoEm.slice(0, 10);
    return c.classe === "pedido" && c.categoria !== null && dia >= de && dia <= ate;
  });

  const porTema = contar(noPeriodo, "categoria");
  const porLocalidade = contar(noPeriodo, "localidade");

  // Sem escolha da pessoa, a lista abre na categoria mais volumosa: é a
  // que a assessoria vai querer ver primeiro.
  const categoria = filtros.categoria ?? porTema[0]?.rotulo ?? null;

  const emFoco = noPeriodo.filter(
    (c) =>
      (categoria === null || c.categoria === categoria) &&
      (filtros.localidade === null || c.localidade === filtros.localidade),
  );

  const rotulo = [categoria, filtros.localidade].filter(Boolean).join(" · ");

  return {
    porTema,
    porLocalidade,
    foco: { rotulo: rotulo || "Todas as demandas", total: emFoco.length },
    ...recortarPagina(emFoco, filtros.pagina),
    categoriasDisponiveis: porTema.map((t) => t.rotulo),
  };
}
