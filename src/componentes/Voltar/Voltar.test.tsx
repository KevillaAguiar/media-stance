import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Voltar } from "./Voltar";

function Destino() {
  return <h1>Perfil</h1>;
}

function Origem() {
  const navegar = useNavigate();
  return (
    <>
      <h1>Cadastro de cliente</h1>
      <Voltar destino="/perfil" rotuloDoDestino="o perfil" />
      <button type="button" onClick={() => navegar("/outra")}>
        Ir adiante
      </button>
    </>
  );
}

function montar(entrada: string) {
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/cliente" element={<Origem />} />
        <Route path="/perfil" element={<Destino />} />
        <Route path="/outra" element={<h1>Outra</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Voltar", () => {
  it("diz para onde vai quando não há tela anterior", () => {
    // Quem abriu a URL direto não tem histórico dentro do produto:
    // `navigate(-1)` aqui mandaria a pessoa para fora dele.
    montar("/cliente");
    expect(screen.getByRole("button", { name: /Voltar para o perfil/ })).toBeInTheDocument();
  });

  it("cai no destino de reserva quando não há de onde voltar", async () => {
    montar("/cliente");
    await userEvent.click(screen.getByRole("button", { name: /Voltar para o perfil/ }));
    expect(screen.getByRole("heading", { name: "Perfil" })).toBeInTheDocument();
  });

  it("diz só 'Voltar' quando existe tela anterior", async () => {
    montar("/cliente");
    await userEvent.click(screen.getByRole("button", { name: "Ir adiante" }));
    expect(screen.getByRole("heading", { name: "Outra" })).toBeInTheDocument();
  });
});
