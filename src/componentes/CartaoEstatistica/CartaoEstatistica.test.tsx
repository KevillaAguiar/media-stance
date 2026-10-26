import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartaoEstatistica } from "./CartaoEstatistica";
import type { ContagemPorClasse } from "../../api";

function contagem(parcial: Partial<ContagemPorClasse> = {}): ContagemPorClasse {
  return { classe: "contra", quantidade: 10, proporcao: 0.25, ...parcial };
}

describe("Cartão de estatística", () => {
  it("escreve quantidade e proporção no formato do país", () => {
    render(<CartaoEstatistica contagem={contagem({ quantidade: 1234, proporcao: 0.6 })} />);
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("não escreve NaN% quando não há denominador", () => {
    // Acontece de verdade: dia sem comentário classificado divide por zero.
    render(<CartaoEstatistica contagem={contagem({ quantidade: 0, proporcao: NaN })} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  /* Os dois seguintes são a mesma regra vista pelas duas pontas: a
     proporção arredondada não pode contradizer a contagem ao lado dela.
     É o mesmo defeito que o relatório por e-mail já tinha e que foi
     corrigido lá — aqui ele continuava. */
  it("não escreve 0% ao lado de uma contagem maior que zero", () => {
    render(<CartaoEstatistica contagem={contagem({ quantidade: 2, proporcao: 0.004 })} />);
    expect(screen.getByText("<1%")).toBeInTheDocument();
  });

  it("não escreve 100% enquanto sobrar alguma coisa de fora", () => {
    render(<CartaoEstatistica contagem={contagem({ quantidade: 999, proporcao: 0.999 })} />);
    expect(screen.getByText(">99%")).toBeInTheDocument();
  });

  it("escreve 0% de verdade quando a contagem é zero", () => {
    render(<CartaoEstatistica contagem={contagem({ quantidade: 0, proporcao: 0 })} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("escreve 100% de verdade quando tudo é daquela classe", () => {
    render(<CartaoEstatistica contagem={contagem({ quantidade: 40, proporcao: 1 })} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
