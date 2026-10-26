import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Paginacao, sequencia } from "./Paginacao";

/* A sequência é a única conta de verdade deste componente, e é onde um
   erro passa despercebido: a tela continua desenhando botões, só que os
   errados. Por isso ela é testada sozinha, sem renderizar nada. */
describe("sequencia de páginas", () => {
  it("mostra todas as páginas quando são poucas", () => {
    expect(sequencia(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(sequencia(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("abrevia o meio quando são muitas", () => {
    expect(sequencia(10, 40)).toEqual([1, "...", 9, 10, 11, "...", 40]);
  });

  it("não abre buraco onde não falta página", () => {
    // Com a atual no começo, 1-2-3 são contíguas: reticências ali diriam
    // que existe algo omitido entre a 1 e a 2.
    expect(sequencia(2, 40)).toEqual([1, 2, 3, "...", 40]);
    expect(sequencia(39, 40)).toEqual([1, "...", 38, 39, 40]);
  });

  it("nunca repete a primeira nem a última", () => {
    for (const p of [1, 2, 20, 39, 40]) {
      const saida = sequencia(p, 40).filter((x) => typeof x === "number");
      expect(new Set(saida).size).toBe(saida.length);
    }
  });

  it("não inventa página fora do intervalo", () => {
    for (const total of [8, 15, 40]) {
      for (let p = 1; p <= total; p++) {
        for (const item of sequencia(p, total)) {
          if (typeof item === "number") {
            expect(item).toBeGreaterThanOrEqual(1);
            expect(item).toBeLessThanOrEqual(total);
          }
        }
      }
    }
  });
});

describe("Paginação", () => {
  it("some quando só há uma página", () => {
    const { container } = render(
      <Paginacao pagina={1} totalDePaginas={1} aoMudar={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("bloqueia a seta que não tem para onde ir", () => {
    render(<Paginacao pagina={1} totalDePaginas={10} aoMudar={() => {}} />);
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeEnabled();
  });

  it("anuncia a página atual a quem não vê a cor", () => {
    render(<Paginacao pagina={3} totalDePaginas={10} aoMudar={() => {}} />);
    expect(screen.getByRole("button", { current: "page" })).toHaveAccessibleName(
      "Página 3",
    );
  });

  it("avisa qual página foi pedida", async () => {
    const aoMudar = vi.fn();
    render(<Paginacao pagina={3} totalDePaginas={10} aoMudar={aoMudar} />);

    await userEvent.click(screen.getByRole("button", { name: "Página 4" }));
    expect(aoMudar).toHaveBeenCalledWith(4);

    await userEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(aoMudar).toHaveBeenCalledWith(2);
  });
});
