import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icone } from "../Icone/Icone";
import {
  listarContasDoCliente,
  trocarContaEmFoco,
  type ContaEmFoco,
} from "../../api";
import estilos from "./SeletorDeConta.module.css";

export interface SeletorDeContaProps {
  foco: ContaEmFoco | null;
  aoTrocar: (conta: ContaEmFoco) => void;
  /**
   * "nav" é o gatilho da barra lateral; "faixa" é a barra do topo do
   * conteúdo, usada no celular, onde não há barra lateral.
   */
  contexto?: "nav" | "faixa";
}

/**
 * Diz qual parlamentar as telas estão mostrando, e deixa trocar.
 *
 * Sem isto o produto é ambíguo: um cliente com duas contas vê números
 * sem saber de quem são. A conta em foco vive na sessão do servidor, não
 * aqui — abrir o sistema de outro aparelho precisa mostrar a mesma.
 */
export function SeletorDeConta({
  foco,
  aoTrocar,
  contexto = "nav",
}: SeletorDeContaProps) {
  const navegar = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [contas, setContas] = useState<ContaEmFoco[]>([]);
  const [trocando, setTrocando] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    listarContasDoCliente()
      .then((c) => ativo && setContas(c))
      .catch(() => {
        /* A lista fica vazia; o gatilho continua dizendo a conta atual. */
      });
    return () => {
      ativo = false;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (area.current && !area.current.contains(e.target as Node)) setAberto(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", escape);
    };
  }, [aberto]);

  async function escolher(id: string) {
    if (foco?.id === id) {
      setAberto(false);
      return;
    }
    setTrocando(id);
    try {
      aoTrocar(await trocarContaEmFoco(id));
      setAberto(false);
    } finally {
      setTrocando(null);
    }
  }

  if (!foco) return null;

  return (
    <div
      ref={area}
      className={`${estilos.area} ${estilos[contexto]}`}
      data-contexto={contexto}
    >
      <button
        type="button"
        className={estilos.gatilho}
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="listbox"
      >
        {/* O ícone aparece nos dois contextos. Na lateral, toda linha
            começa com um ícone na mesma coluna; sem ele o seletor era a
            única linha fora do alinhamento e parecia incompleto. */}
        <span className={estilos.avatar} aria-hidden="true">
          <Icone nome="person" tamanho={20} />
        </span>
        <span className={estilos.identidade}>
          <span className={estilos.nome}>{foco.nome}</span>
          <span className={estilos.usuario}>{foco.usuario}</span>
        </span>
        <Icone nome="arrow_drop_down" tamanho={20} />
      </button>

      {aberto && (
        <>
          {/* No celular a lista sobe de baixo, então o véu existe para
              escurecer o conteúdo e fechar no toque fora. No desktop ele
              não aparece: o popover já fecha no clique fora. */}
          <div className={estilos.veu} onClick={() => setAberto(false)} />

          <div className={estilos.lista} role="listbox" aria-label="Trocar de conta">
            <p className={estilos.tituloLista}>Trocar de conta</p>

            {contas.map((c) => {
              const atual = c.id === foco.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={atual}
                  className={`${estilos.opcao} ${atual ? estilos.atual : ""}`}
                  onClick={() => escolher(c.id)}
                  disabled={trocando !== null}
                >
                  <span className={estilos.avatar} aria-hidden="true">
                    <Icone nome="person" tamanho={18} />
                  </span>
                  <span className={estilos.identidade}>
                    <span className={estilos.nome}>{c.nome}</span>
                    {/* Conta sem conexão aparece, e aparece dizendo por quê:
                        escondê-la faria a pessoa trocar e ver um painel
                        vazio sem entender o motivo. */}
                    <span className={c.conectada ? estilos.usuario : estilos.semConexao}>
                      {c.usuario}
                      {!c.conectada && " · não conectada"}
                    </span>
                  </span>
                  {atual && <Icone nome="check_circle" tamanho={18} />}
                </button>
              );
            })}

            <button
              type="button"
              className={estilos.gerenciar}
              onClick={() => {
                setAberto(false);
                navegar("/configuracoes/cliente");
              }}
            >
              Gerenciar contas
            </button>
          </div>
        </>
      )}
    </div>
  );
}
