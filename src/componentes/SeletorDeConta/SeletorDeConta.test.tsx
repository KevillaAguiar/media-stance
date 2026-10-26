import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SeletorDeConta } from "./SeletorDeConta";
import type { ContaEmFoco } from "../../api";

const navegar = vi.fn();
vi.mock("react-router-dom", async (original) => ({
  ...(await original<typeof import("react-router-dom")>()),
  useNavigate: () => navegar,
}));

vi.mock("../../api", async (original) => ({
  ...(await original<typeof import("../../api")>()),
  listarContasDoCliente: vi.fn(),
  trocarContaEmFoco: vi.fn(),
}));

const api = await import("../../api");
const listar = vi.mocked(api.listarContasDoCliente);
const trocar = vi.mocked(api.trocarContaEmFoco);

const LIMMA: ContaEmFoco = { id: "c1", nome: "Deputado Limma", usuario: "@dep.limma", conectada: true };
const ELZUILA: ContaEmFoco = { id: "c2", nome: "Deputada Elzuila", usuario: "@dep.elzuila", conectada: false };

beforeEach(() => {
  navegar.mockClear();
  listar.mockResolvedValue([LIMMA, ELZUILA]);
  trocar.mockResolvedValue(ELZUILA);
});

function montar(aoTrocar = vi.fn()) {
  render(
    <MemoryRouter>
      <SeletorDeConta foco={LIMMA} aoTrocar={aoTrocar} />
    </MemoryRouter>,
  );
  return { aoTrocar };
}

describe("Seletor de conta", () => {
  it("diz de qual parlamentar são os números na tela", () => {
    montar();
    // Sem isto o produto é ambíguo: um cliente com duas contas vê números
    // sem saber de quem são.
    expect(screen.getByRole("button", { expanded: false })).toHaveTextContent("Deputado Limma");
  });

  it("não busca a lista antes de alguém abrir", () => {
    montar();
    expect(listar).not.toHaveBeenCalled();
  });

  it("mostra a conta sem conexão, dizendo que está sem conexão", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { expanded: false }));

    const opcao = await screen.findByRole("option", { name: /Deputada Elzuila/ });
    // Escondê-la faria a pessoa trocar e ver um painel vazio sem entender.
    expect(opcao).toHaveTextContent("não conectada");
  });

  it("marca qual conta está em foco para quem usa leitor de tela", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { expanded: false }));

    expect(await screen.findByRole("option", { name: /Deputado Limma/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: /Deputada Elzuila/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("troca o foco pela API e avisa quem desenha as telas", async () => {
    const { aoTrocar } = montar();
    await userEvent.click(screen.getByRole("button", { expanded: false }));
    await userEvent.click(await screen.findByRole("option", { name: /Deputada Elzuila/ }));

    // A troca é uma chamada ao servidor, não um estado local: o foco mora
    // na sessão, para o sistema mostrar a mesma conta em outro aparelho.
    await waitFor(() => expect(trocar).toHaveBeenCalledWith("c2"));
    expect(aoTrocar).toHaveBeenCalledWith(ELZUILA);
  });

  it("fecha com Escape", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { expanded: false }));
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("leva ao cadastro de cliente e fecha", async () => {
    montar();
    await userEvent.click(screen.getByRole("button", { expanded: false }));
    await userEvent.click(await screen.findByRole("button", { name: "Gerenciar contas" }));

    expect(navegar).toHaveBeenCalledWith("/configuracoes/cliente");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("não desenha nada enquanto o foco não chegou", () => {
    render(
      <MemoryRouter>
        <SeletorDeConta foco={null} aoTrocar={vi.fn()} />
      </MemoryRouter>,
    );
    // Um gatilho vazio piscando na lateral é pior do que gatilho nenhum.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
