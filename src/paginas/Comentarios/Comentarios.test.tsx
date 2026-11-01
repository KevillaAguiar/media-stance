import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Comentarios } from "./Comentarios";
import { paginaDeComentarios, diasAtras } from "../../api/consultas";
import type { Comentario, FiltrosDeComentarios } from "../../api";

/* Os filtros moram na URL. Isto é o que torna a tela recarregável e
   compartilhável, e também o que a expõe: `?pagina=99` e `?periodo=lixo`
   chegam de verdade, e o tipo TypeScript não vale nada do lado de fora.
   Estes testes percorrem o caminho inteiro — URL, filtro, lista. */

vi.mock("../../api", async (original) => ({
  ...(await original<typeof import("../../api")>()),
  obterComentarios: vi.fn(),
}));

const api = await import("../../api");
const obter = vi.mocked(api.obterComentarios);

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

/* 12 comentários de hoje, para haver mais de uma página (5 por página). */
const ACERVO: Comentario[] = [
  ...Array.from({ length: 8 }, (_, i) =>
    comentario({
      publicadoEm: `${diasAtras(0)}T0${i}:00:00`,
      classe: "a_favor",
      tema: "obras",
    }),
  ),
  comentario({ publicadoEm: `${diasAtras(0)}T09:00:00`, classe: "contra", urgente: true, tema: "saúde" }),
  comentario({ publicadoEm: `${diasAtras(0)}T10:00:00`, classe: "contra", tema: "obras" }),
  comentario({ publicadoEm: `${diasAtras(0)}T11:00:00`, classe: "pedido", tema: "saúde" }),
  comentario({ publicadoEm: `${diasAtras(20)}T11:00:00`, classe: "pedido", tema: "antigo" }),
];

let urlAtual = "";

function Espiao() {
  urlAtual = useLocation().search;
  return null;
}

function abrir(busca = "") {
  urlAtual = busca;
  render(
    <MemoryRouter initialEntries={[`/comentarios${busca}`]}>
      <Routes>
        <Route path="/comentarios" element={<><Comentarios /><Espiao /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // O duplo é a consulta de verdade, sobre dados inventados: assim o
  // teste cobre o caminho URL → filtro → lista, e não só a chamada.
  obter.mockImplementation(async (f: FiltrosDeComentarios) =>
    paginaDeComentarios(ACERVO, f),
  );
});

async function itensNaTela() {
  await waitFor(() => expect(screen.queryByText("Carregando…")).not.toBeInTheDocument());
  return screen.queryAllByRole("listitem");
}

describe("Tela de comentários", () => {
  it("abre no dia de hoje", async () => {
    abrir();
    await waitFor(() => expect(obter).toHaveBeenCalled());
    expect(obter.mock.calls[0][0].periodo).toBe("hoje");
  });

  it("chega já filtrado quando o resumo do dia manda por urgentes", async () => {
    // É o link "Ver comentários" do alerta de urgentes.
    abrir("?urgentes=1");
    await waitFor(() => expect(obter).toHaveBeenCalled());

    expect(obter.mock.calls[0][0].apenasUrgentes).toBe(true);
    expect(await screen.findByRole("button", { name: /Apenas urgentes/ })).toBeInTheDocument();
  });

  it("tira o filtro de urgentes quando a pessoa fecha o chip", async () => {
    abrir("?urgentes=1");
    await userEvent.click(await screen.findByRole("button", { name: /Apenas urgentes/ }));
    await waitFor(() => expect(urlAtual).not.toContain("urgentes"));
  });

  it("guarda a classe escolhida na URL", async () => {
    abrir();
    await userEvent.click(await screen.findByRole("button", { name: "Contra" }));

    await waitFor(() => expect(urlAtual).toContain("classe=contra"));
    expect(screen.getByRole("button", { name: "Contra" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("volta para a primeira página ao trocar de filtro", async () => {
    // Sem isso a pessoa fica na página 4 de um resultado que agora tem
    // uma, e vê uma lista vazia.
    abrir("?pagina=2");
    await userEvent.click(await screen.findByRole("button", { name: "Contra" }));

    await waitFor(() => expect(urlAtual).not.toContain("pagina"));
  });

  it("não devolve lista vazia com uma página que não existe", async () => {
    abrir("?pagina=99");
    // `?pagina=99` é edição de URL e link velho. Lista vazia aqui
    // pareceria "nenhum comentário encontrado".
    expect(await itensNaTela()).not.toHaveLength(0);
  });

  it("não devolve lista vazia com uma página que não é número", async () => {
    abrir("?pagina=abc");
    expect(await itensNaTela()).not.toHaveLength(0);
  });

  it("ignora um período que não existe e usa o da tela", async () => {
    abrir("?periodo=lixo");
    await waitFor(() => expect(obter).toHaveBeenCalled());
    expect(obter.mock.calls[0][0].periodo).toBe("hoje");
    expect(await itensNaTela()).not.toHaveLength(0);
  });

  it("só aceita o intervalo personalizado com as duas pontas e em ordem", async () => {
    abrir("?periodo=personalizado&de=2026-05-10");
    await waitFor(() => expect(obter).toHaveBeenCalled());
    // Uma ponta só não é intervalo; aceitar levaria a um recorte que a
    // pessoa não pediu.
    expect(obter.mock.calls[0][0].intervalo).toBeNull();
  });

  it("recusa intervalo invertido", async () => {
    abrir("?periodo=personalizado&de=2026-05-20&ate=2026-05-10");
    await waitFor(() => expect(obter).toHaveBeenCalled());
    expect(obter.mock.calls[0][0].intervalo).toBeNull();
  });

  it("mostra o estado vazio em vez de uma lista em branco", async () => {
    abrir("?classe=contra&periodo=personalizado&de=2020-01-01&ate=2020-01-02");
    expect(
      await screen.findByText("Nenhum comentário por aqui"),
    ).toBeInTheDocument();
  });

  it("avisa quando a busca falha, em vez de ficar carregando para sempre", async () => {
    obter.mockRejectedValue(new Error("Falha ao carregar os comentários."));
    abrir();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao carregar os comentários.",
    );
  });
});
