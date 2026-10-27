import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as demo from "./demo";
import { hoje, diasAtras } from "./consultas";
import type { Comentario } from "./tipos";

/* Nenhum comentário real aqui. A base é inventada e tem a mesma forma da
   que o gerador produz — é isso que permite versionar este arquivo. */

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

function base(parcial: Record<string, unknown> = {}) {
  return {
    geradoEm: "2026-11-12T08:00:00",
    origem: {
      corpus: "inventado.csv",
      modelo: "nenhum",
      comentarios: 4,
      periodoReal: { de: "2026-01-01", ate: "2026-08-15" },
      diaDoCorpusComoHoje: "2026-08-15",
      deslocamentoEmDias: 89,
      regraDoNumeroDoPartido: { decididaEm: "2026-10-26", comentariosAfetados: { Limma: 75 } },
    },
    porConta: {
      conta_a: {
        conta: { nome: "Deputado A", usuario: "@dep.a" },
        partido: { sigla: "XX", numero_partido: "13", numero_candidato: "13123" },
        classificados: [
          { classe: "a_favor", quantidade: 3, proporcao: 0.75 },
          { classe: "contra", quantidade: 1, proporcao: 0.25 },
          { classe: "pedido", quantidade: 0, proporcao: 0 },
          { classe: "neutro", quantidade: 0, proporcao: 0 },
        ],
        engajamentoAfetivo: { quantidade: 10, proporcao: 0.71 },
        comentarios: [
          comentario({ publicadoEm: `${hoje()}T09:00:00`, urgente: true, classe: "contra" }),
          comentario({ publicadoEm: `${diasAtras(2)}T09:00:00`, urgente: true }),
          comentario({ publicadoEm: `${diasAtras(2)}T10:00:00` }),
          comentario({ publicadoEm: `${diasAtras(40)}T10:00:00` }),
        ],
        publicacoes: [
          // Abaixo do mínimo e com 100% de crítica: a armadilha que a
          // regra do mínimo existe para evitar.
          { id: "p_pequena", legenda: "pequena", comentarios: 3, contra: 3, permalink: "" },
          { id: "p_grande", legenda: "grande", comentarios: 50, contra: 5, permalink: "" },
        ],
      },
      conta_b: {
        conta: { nome: "Deputada B", usuario: "@dep.b" },
        partido: { sigla: "XX", numero_partido: "13", numero_candidato: "13333" },
        classificados: [],
        engajamentoAfetivo: { quantidade: 0, proporcao: 0 },
        comentarios: [],
        publicacoes: [],
      },
    },
    ...parcial,
  };
}

function servir(corpo: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, json: async () => corpo } as Response),
  );
}

beforeEach(() => demo.esquecerBase());
afterEach(() => vi.unstubAllGlobals());

describe("Base de demonstração", () => {
  it("busca o arquivo uma vez só", async () => {
    servir(base());
    await demo.resumoDoDia();
    await demo.paginaDeComentarios({
      classe: null, tema: null, periodo: "7dias", intervalo: null,
      apenasUrgentes: false, pagina: 1,
    });
    // São alguns megabytes: buscar a cada navegação deixaria a
    // demonstração lenta justamente nas trocas de tela.
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("explica o que fazer quando o arquivo não está lá", async () => {
    servir(null, false);
    // Um 404 cru na tela não diz a ninguém que falta gerar a base.
    await expect(demo.resumoDoDia()).rejects.toThrow(/gerar_base_demo/);
  });

  it("conta como urgente só o que é de hoje", async () => {
    servir(base());
    // Há dois urgentes na base, mas só um é de hoje. Urgente é o que
    // exige resposta HOJE, não na janela inteira.
    expect((await demo.resumoDoDia()).urgentes).toBe(1);
  });

  it("ignora publicação abaixo do mínimo no cálculo de atrito", async () => {
    servir(base());
    const r = await demo.resumoDoDia();
    // A pequena tem 100% de crítica em 3 comentários: lideraria o
    // ranking sem significar nada.
    expect(r.publicacaoComMaiorAtrito?.id).toBe("p_grande");
    expect(r.publicacaoComMaiorAtrito?.taxaDeAtrito).toBeCloseTo(0.1);
  });

  it("não reporta atrito quando nenhuma publicação atinge o mínimo", async () => {
    const b = base();
    b.porConta.conta_a.publicacoes = [
      { id: "p", legenda: "p", comentarios: 3, contra: 1, permalink: "" },
    ];
    servir(b);
    expect((await demo.resumoDoDia()).publicacaoComMaiorAtrito).toBeNull();
  });

  it("filtra por período sobre os dados reais", async () => {
    servir(base());
    const filtros = {
      classe: null, tema: null, intervalo: null, apenasUrgentes: false, pagina: 1,
    };
    const semana = await demo.paginaDeComentarios({ ...filtros, periodo: "7dias" });
    const mes = await demo.paginaDeComentarios({ ...filtros, periodo: "30dias" });

    expect(semana.total).toBe(3);
    expect(mes.total).toBe(3); // o de 40 dias atrás fica fora dos dois
  });

  it("lista as contas da base e troca o foco", async () => {
    servir(base());
    expect((await demo.contas()).map((c) => c.id)).toEqual(["conta_a", "conta_b"]);
    expect((await demo.foco()).usuario).toBe("@dep.a");

    expect((await demo.trocarFoco("conta_b")).usuario).toBe("@dep.b");
    // Trocar o foco troca o que as telas mostram, não só o rótulo.
    expect((await demo.resumoDoDia()).conta.usuario).toBe("@dep.b");
  });

  it("ignora troca para uma conta que não está na base", async () => {
    servir(base());
    await demo.trocarFoco("conta_inexistente");
    expect((await demo.foco()).id).toBe("conta_a");
  });

  it("entrega a procedência para o rodapé dizer de onde vêm os números", async () => {
    servir(base());
    const o = await demo.procedencia();
    // Sem isto a tela apresentaria dado de agosto como sendo de hoje.
    expect(o.diaDoCorpusComoHoje).toBe("2026-08-15");
    expect(o.regraDoNumeroDoPartido.comentariosAfetados).toEqual({ Limma: 75 });
  });
});
