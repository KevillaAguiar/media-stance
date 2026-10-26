import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModalAdicionarConta } from "./ModalAdicionarConta";
import type { Cliente, ContaDaMeta } from "../../api";

vi.mock("../../api", async (original) => ({
  ...(await original<typeof import("../../api")>()),
  listarContasDaMeta: vi.fn(),
  vincularContasDaMeta: vi.fn(),
}));

const api = await import("../../api");
const listar = vi.mocked(api.listarContasDaMeta);
const vincular = vi.mocked(api.vincularContasDaMeta);

const DA_META: ContaDaMeta[] = [
  { id: "ig_1", nome: "Deputado Limma", usuario: "@dep.limma",
    pagina: "Dep. Limma", jaVinculada: true, impedimento: null },
  { id: "ig_2", nome: "Limma Notícias", usuario: "@limma.noticias",
    pagina: "Limma Notícias", jaVinculada: false, impedimento: null },
  { id: null, nome: "Gabinete Limma", usuario: null, pagina: "Gabinete Limma",
    jaVinculada: false, impedimento: "Página sem conta do Instagram vinculada" },
];

const CLIENTE: Cliente = { id: "c1", nome: "Mandato Limma", tipo: "mandato", contas: [] };

beforeEach(() => {
  listar.mockResolvedValue(DA_META);
  vincular.mockResolvedValue(CLIENTE);
});

function abrir(aoVincular = vi.fn(), aoFechar = vi.fn()) {
  render(<ModalAdicionarConta aberto aoFechar={aoFechar} aoVincular={aoVincular} />);
  return { aoVincular, aoFechar };
}

async function irAteAEscolha() {
  await userEvent.click(screen.getByRole("button", { name: /Continuar na Meta/ }));
  await screen.findByText("Limma Notícias");
}

describe("Modal de adicionar conta", () => {
  it("não oferece campo para digitar a conta", async () => {
    abrir();
    await irAteAEscolha();
    // O ponto inteiro do fluxo: o identificador vem da Meta. Um campo de
    // texto aqui significaria que alguém reintroduziu o palpite.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("deixa marcar só a conta que dá para vincular", async () => {
    abrir();
    await irAteAEscolha();

    expect(screen.getByRole("checkbox", { name: /Limma Notícias/ })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: /Deputado Limma/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /Gabinete Limma/ })).toBeDisabled();
  });

  it("explica por que a conta bloqueada não dá, em vez de escondê-la", async () => {
    abrir();
    await irAteAEscolha();
    // Sumir com ela faria a pessoa procurar uma conta que está ali.
    expect(screen.getByText("Página sem conta do Instagram vinculada")).toBeInTheDocument();
    expect(screen.getAllByText("já vinculada").length).toBeGreaterThan(0);
  });

  it("não conta uma ação que não existe no rótulo do botão", async () => {
    abrir();
    await irAteAEscolha();

    const confirmar = screen.getByRole("button", { name: /^Adicionar/ });
    expect(confirmar).toHaveTextContent("Adicionar conta");
    expect(confirmar).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox", { name: /Limma Notícias/ }));
    expect(confirmar).toHaveTextContent("Adicionar 1 conta");
    expect(confirmar).toBeEnabled();
  });

  it("manda só identificadores para a API, nunca nome nem @", async () => {
    const { aoVincular, aoFechar } = abrir();
    await irAteAEscolha();

    await userEvent.click(screen.getByRole("checkbox", { name: /Limma Notícias/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Adicionar/ }));

    await waitFor(() => expect(vincular).toHaveBeenCalledWith(["ig_2"]));
    expect(aoVincular).toHaveBeenCalledWith(CLIENTE);
    expect(aoFechar).toHaveBeenCalled();
  });

  it("não fecha nem avisa ninguém quando a vinculação falha", async () => {
    vincular.mockRejectedValue(new Error("A Meta recusou a requisição."));
    const { aoVincular, aoFechar } = abrir();
    await irAteAEscolha();

    await userEvent.click(screen.getByRole("checkbox", { name: /Limma Notícias/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Adicionar/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A Meta recusou a requisição.");
    // Fechar aqui apagaria o erro junto com a escolha que a pessoa fez.
    expect(aoFechar).not.toHaveBeenCalled();
    expect(aoVincular).not.toHaveBeenCalled();
  });

  it("volta ao início quando a Meta não responde, em vez de travar", async () => {
    listar.mockRejectedValue(new Error("Não foi possível falar com a Meta."));
    abrir();

    await userEvent.click(screen.getByRole("button", { name: /Continuar na Meta/ }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar na Meta/ })).toBeEnabled();
  });
});
