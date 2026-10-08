import { useEffect, useId, useRef, useState } from "react";
import { Icone, type NomeDeIcone } from "../Icone/Icone";
import estilos from "./Menu.module.css";

export interface OpcaoDeMenu<T extends string> {
  valor: T;
  rotulo: string;
}

export interface MenuProps<T extends string> {
  /** Prefixo do gatilho, ex.: "Tema". O valor escolhido vem depois. */
  rotulo: string;
  opcoes: OpcaoDeMenu<T>[];
  valor: T;
  aoEscolher: (valor: T) => void;
  /** Ícone à esquerda do gatilho, como o calendário do seletor de período. */
  icone?: NomeDeIcone;
  /** Quando falso, o gatilho mostra só o valor, sem "rotulo: ". */
  mostrarRotulo?: boolean;
}

/**
 * Menu de escolha única.
 *
 * Teclado: Escape fecha e devolve o foco ao gatilho, setas andam pelas
 * opções, Enter escolhe. Sem isso o menu seria operável apenas com mouse
 * — e todo filtro desta tela passa por ele.
 */
export function Menu<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  icone,
  mostrarRotulo = true,
}: MenuProps<T>) {
  const [aberto, setAberto] = useState(false);
  const [emFoco, setEmFoco] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const idLista = useId();

  const escolhida = opcoes.find((o) => o.valor === valor) ?? opcoes[0];

  function fechar(devolverFoco = true) {
    setAberto(false);
    if (devolverFoco) gatilho.current?.focus();
  }

  function abrir() {
    setEmFoco(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
    setAberto(true);
  }

  // Clique fora fecha, mas sem roubar o foco: quem clicou já escolheu
  // onde quer estar.
  useEffect(() => {
    if (!aberto) return;
    function aoClicar(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  function aoTeclar(evento: React.KeyboardEvent) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      fechar();
      return;
    }
    if (!aberto) {
      if (evento.key === "ArrowDown" || evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        abrir();
      }
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setEmFoco((i) => (i + 1) % opcoes.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setEmFoco((i) => (i - 1 + opcoes.length) % opcoes.length);
    } else if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      aoEscolher(opcoes[emFoco].valor);
      fechar();
    }
  }

  return (
    <div className={estilos.raiz} ref={raiz} onKeyDown={aoTeclar}>
      <button
        type="button"
        ref={gatilho}
        className={estilos.gatilho}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idLista : undefined}
        onClick={() => (aberto ? fechar(false) : abrir())}
      >
        {icone && <Icone nome={icone} tamanho={20} className={estilos.icone} />}
        <span>
          {mostrarRotulo ? `${rotulo}: ` : ""}
          {escolhida.rotulo}
        </span>
        <Icone nome="arrow_drop_down" tamanho={20} className={estilos.seta} />
      </button>

      {aberto && (
        <ul className={estilos.lista} id={idLista} role="menu" aria-label={rotulo}>
          {opcoes.map((opcao, i) => (
            <li key={opcao.valor}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={opcao.valor === valor}
                className={`${estilos.opcao} ${i === emFoco ? estilos.emFoco : ""}`}
                onMouseEnter={() => setEmFoco(i)}
                onClick={() => {
                  aoEscolher(opcao.valor);
                  fechar();
                }}
              >
                {opcao.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
