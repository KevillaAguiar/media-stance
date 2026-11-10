import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Demandas } from "./Demandas";
import { painelDeDemandas, diasAtras } from "../../api/consultas";
import type { Comentario, FiltrosDeDemandas } from "../../api";

vi.mock("../../api", async (original) => ({
  ...(await original<typeof import("../../api")>()),
  obterDemandas: vi.fn(),
}));

const api = await import("../../api");
const obter = vi.mocked(api.obterDemandas);

function pedido(categoria: string, localidade: string, dias = 1): Comentario {
  return {
    id: Math.random().toString(36).slice(2),
    texto: "texto inventado",
    classe: "pedido",
    urgente: false,
    tema: categoria.toLowerCase(),
    categoria,
    localidade,
    publicadoEm: `${diasAtras(dias)}T09:00:00`,
    urlNaRede: "https://exemplo.invalid/p/1",
  };
}

const ACERVO: Comentario[] = [
  pedido("Saúde", "Teresina"),
  pedido("Saúde", "Teresina"),
  pedido("Saúde", "Parnaíba"),
  pedido("Infraestrutura", "Teresina"),
  pedido("Infraestrutura", "Parnaíba"),
  { ...pedido("Saúde", "Teresina"), classe: "contra" },
];

let urlAtual = "";

function Espiao() {
  urlAtual = useLocation().search;
  return null;
}

function abrir(busca = "") {
  urlAtual = busca;
  render(
    <MemoryRouter initialEntries={[`/demandas${busca}`]}>
      <Routes>
        <Route path="/demandas" element={<><Demandas /><Espiao /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  obter.mockImplementation(async (f: FiltrosDeDemandas) =>
    painelDeDemandas(ACERVO, f),
  );
});

async function pronto() {
  await waitFor(() =>
    expect(screen.queryByText("Carregando…")).not.toBeInTheDocument(),
  );
}

describe("Painel de demandas", () => {
  it("abre em 7 dias, e não em hoje", async () => {
    // Pedido de eleitor se acumula; um dia só costuma render pouco
    // para encaminhar.
    abrir();
    await waitFor(() => expect(obter).toHaveBeenCalled());
    expect(obter.mock.calls[0][0].periodo).toBe("7dias");
  });

  it("abre na categoria mais volumosa sem ninguém escolher", async () => {
    abrir();
    await pronto();
    expect(screen.getByRole("heading", { name: /Saúde \(3\)/ })).toBeInTheDocument();
  });

  it("troca o recorte quando a categoria é escolhida, e guarda na URL", async () => {
    abrir();
    await pronto();

    await userEvent.click(screen.getByRole("button", { name: /Infraestrutura/ }));

    await waitFor(() => expect(urlAtual).toContain("categoria=Infraestrutura"));
    expect(await screen.findByRole("heading", { name: /Infraestrutura \(2\)/ })).toBeInTheDocument();
  });

  it("cruza categoria e localidade em vez de trocar uma pela outra", async () => {
    abrir("?categoria=Sa%C3%BAde");
    await pronto();

    await userEvent.click(screen.getByRole("button", { name: /Teresina/ }));

    await waitFor(() => expect(urlAtual).toContain("localidade=Teresina"));
    expect(urlAtual).toContain("categoria=Sa");
    expect(
      await screen.findByRole("heading", { name: /Saúde · Teresina \(2\)/ }),
    ).toBeInTheDocument();
  });

  it("mostra todas as demandas da localidade quando só ela foi escolhida", async () => {
    // Clicar em "Teresina (3)" e ver só as de uma categoria escolhida por
    // baixo dos panos parece contagem errada. A categoria mais volumosa só
    // vale como ponto de partida quando a pessoa ainda não escolheu nada.
    abrir("?localidade=Teresina");
    await pronto();

    expect(
      await screen.findByRole("heading", { name: /^Teresina \(3\)$/ }),
    ).toBeInTheDocument();
  });

  it("desfaz o filtro ao clicar no recorte que já está em foco", async () => {
    abrir("?categoria=Sa%C3%BAde");
    await pronto();

    // Clicar de novo no que já está selecionado tem que desfazer, em
    // vez de não fazer nada.
    await userEvent.click(screen.getByRole("button", { name: /Saúde/ }));
    await waitFor(() => expect(urlAtual).not.toContain("categoria"));
  });

  it("limpa os dois recortes de uma vez", async () => {
    abrir("?categoria=Sa%C3%BAde&localidade=Teresina");
    await pronto();

    await userEvent.click(screen.getByRole("button", { name: /Limpar recorte/ }));

    await waitFor(() => expect(urlAtual).not.toContain("categoria"));
    expect(urlAtual).not.toContain("localidade");
  });

  it("volta para a primeira página ao trocar de recorte", async () => {
    abrir("?pagina=2");
    await pronto();

    await userEvent.click(screen.getByRole("button", { name: /Infraestrutura/ }));
    await waitFor(() => expect(urlAtual).not.toContain("pagina"));
  });

  it("não devolve painel vazio com uma página que não existe", async () => {
    abrir("?pagina=99");
    await pronto();
    expect(screen.queryAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("ignora um período que não existe e usa o da tela", async () => {
    abrir("?periodo=lixo");
    await waitFor(() => expect(obter).toHaveBeenCalled());
    expect(obter.mock.calls[0][0].periodo).toBe("7dias");
  });

  it("diz que não há nada no período em vez de mostrar ranking vazio", async () => {
    abrir("?periodo=hoje");
    await pronto();
    // Os pedidos do acervo são de ontem.
    expect(screen.getAllByText("Nada no período escolhido.")).toHaveLength(2);
  });

  it("etiqueta cada pedido pelo recorte do painel, e não pelo tema", async () => {
    // Na API real `tema` e `categoria` são campos diferentes. No mock eram
    // a mesma palavra, e por isso a tela nunca mostrou o defeito: ao
    // filtrar por localidade, a etiqueta continuava sendo o tema.
    obter.mockImplementation(async (f: FiltrosDeDemandas) =>
      painelDeDemandas(
        [{ ...pedido("Saúde", "Teresina"), tema: "obras" }],
        f,
      ),
    );
    abrir("?localidade=Teresina");
    await pronto();

    // Os painéis "Por tema" e "Por localidade" também são listas; o card
    // é o item que tem o botão de abrir o comentário.
    const item = screen
      .getAllByRole("listitem")
      .find((li) => within(li).queryByRole("button", { name: /Ver comentário/ }))!;
    expect(within(item).getByText("Saúde")).toBeInTheDocument();
    expect(within(item).getByText("Teresina")).toBeInTheDocument();
    expect(within(item).queryByText("obras")).not.toBeInTheDocument();
  });

  it("avisa quando a busca falha", async () => {
    obter.mockRejectedValue(new Error("Falha ao carregar as demandas."));
    abrir();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falha ao carregar as demandas.",
    );
  });
});
