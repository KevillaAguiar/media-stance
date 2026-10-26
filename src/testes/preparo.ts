import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/* Cada teste começa com a tela limpa e sem resto do anterior. Sem isto um
   `getByRole` encontra o botão renderizado pelo teste de cima e passa por
   motivo errado — que é pior do que falhar. */
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

/* jsdom não implementa a API de <dialog>: sem estes dois, `showModal()`
   lança e qualquer teste do modal morre antes de chegar ao que importa.
   O que estamos simulando é só a abertura — o comportamento que os testes
   verificam (o que a lista mostra, o que dá para marcar) é nosso. */
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

/* jsdom também não implementa `matchMedia`, e o tema pergunta ao sistema
   qual é a preferência de cor logo no primeiro render. Sem este esboço,
   qualquer teste que monte o App morre antes de chegar ao assunto. */
if (!window.matchMedia) {
  window.matchMedia = (consulta: string) =>
    ({
      matches: false,
      media: consulta,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
