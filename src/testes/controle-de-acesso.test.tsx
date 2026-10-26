import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import type { PapelDoUsuario, Perfil } from "../api";

vi.mock("../api", async (original) => {
  const real = await original<typeof import("../api")>();
  return { ...real, obterPerfil: vi.fn() };
});

const api = await import("../api");
const obterPerfil = vi.mocked(api.obterPerfil);

const ROTAS_DE_ADMINISTRACAO = [
  ["/configuracoes/cliente", "O cadastro de cliente"],
  ["/configuracoes/politica", "A configuração política"],
  ["/conectar-conta", "Conectar conta"],
] as const;

function perfil(papel: PapelDoUsuario): Perfil {
  return {
    nome: "Kévilla",
    cargo: "Assessoria",
    email: "kevilla@exemplo.com",
    contaVinculada: "@dep.limma",
    papel,
  };
}

beforeEach(() => {
  // A sessão simulada é só um sinalizador no navegador; sem ele o App
  // manda para o login antes de chegar à checagem de papel.
  localStorage.setItem("media-stance:sessao-simulada", "1");
});

function abrir(rota: string) {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Controle de acesso por papel", () => {
  it.each(ROTAS_DE_ADMINISTRACAO)(
    "barra o assessor em %s e diz por quê",
    async (rota, area) => {
      obterPerfil.mockResolvedValue(perfil("assessor"));
      abrir(rota);

      expect(await screen.findByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
      // A mensagem nomeia a área: "você não tem permissão" sozinho faz a
      // pessoa achar que clicou errado e tentar de novo.
      expect(screen.getByText(new RegExp(area))).toBeInTheDocument();
    },
  );

  it.each(ROTAS_DE_ADMINISTRACAO)("deixa o administrador entrar em %s", async (rota) => {
    obterPerfil.mockResolvedValue(perfil("administrador"));
    abrir(rota);

    expect(await screen.findByRole("heading", { level: 1 })).not.toHaveTextContent(
      "Acesso restrito",
    );
  });

  it("não pisca 'acesso restrito' enquanto o papel não chegou", () => {
    // Promessa que nunca resolve = o instante entre abrir e o perfil voltar.
    obterPerfil.mockReturnValue(new Promise(() => {}));
    abrir("/configuracoes/cliente");

    expect(screen.queryByText("Acesso restrito")).not.toBeInTheDocument();
  });

  it("trata falha ao ler o perfil como o papel mais restrito", async () => {
    obterPerfil.mockRejectedValue(new Error("fora do ar"));
    abrir("/configuracoes/cliente");

    // Falhar para o lado permissivo mostraria a tela de administração a
    // quem não deveria vê-la sempre que a rede oscilasse.
    expect(await screen.findByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
  });

  it("manda para o login quem não está em sessão", () => {
    localStorage.clear();
    obterPerfil.mockResolvedValue(perfil("administrador"));
    abrir("/configuracoes/cliente");

    expect(screen.getByRole("heading", { name: /Entrar/i })).toBeInTheDocument();
  });

  it("deixa o assessor nas telas de leitura", async () => {
    obterPerfil.mockResolvedValue(perfil("assessor"));
    abrir("/comentarios");

    expect(await screen.findByRole("heading", { level: 1 })).not.toHaveTextContent(
      "Acesso restrito",
    );
  });
});
