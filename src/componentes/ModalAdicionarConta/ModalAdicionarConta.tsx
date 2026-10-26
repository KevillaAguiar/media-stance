import { useEffect, useId, useRef, useState } from "react";
import { Botao } from "../Botao/Botao";
import { Icone } from "../Icone/Icone";
import {
  listarContasDaMeta,
  vincularContasDaMeta,
  type Cliente,
  type ContaDaMeta,
} from "../../api";
import estilos from "./ModalAdicionarConta.module.css";

const PASSOS = [
  "Você vai para o login da Meta, na página dela.",
  "Aprova o acesso às Páginas que administra.",
  "Volta para cá e escolhe quais contas vincular.",
];

type Etapa = "inicio" | "carregando" | "escolher";

export interface ModalAdicionarContaProps {
  aberto: boolean;
  aoFechar: () => void;
  aoVincular: (cliente: Cliente) => void;
}

/**
 * Adicionar conta pelo caminho que a API usa.
 *
 * A conta NÃO é digitada. O identificador que a Meta usa vem dela, junto
 * com o nome e o @ — digitado, ele seria um palpite sobre qual conta é,
 * e o erro só apareceria na hora de coletar.
 *
 * Usa `<dialog>` com `showModal()` pelo mesmo motivo do modal de
 * comentário: foco preso, Escape, fundo inerte e devolução do foco já
 * vêm prontos.
 */
export function ModalAdicionarConta({
  aberto,
  aoFechar,
  aoVincular,
}: ModalAdicionarContaProps) {
  const caixa = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [contas, setContas] = useState<ContaDaMeta[]>([]);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    else if (!aberto && el.open) el.close();
    // Reabrir volta ao início: deixar a lista da vez anterior na tela
    // faria a pessoa escolher sobre dados que podem ter mudado.
    if (aberto) {
      setEtapa("inicio");
      setContas([]);
      setMarcadas(new Set());
      setErro(null);
    }
  }, [aberto]);

  async function irParaMeta() {
    setErro(null);
    setEtapa("carregando");
    try {
      // Com a API real, aqui a pessoa sai para a Meta e volta pela rota
      // de retorno. O mock encurta o caminho para a tela poder ser
      // percorrida inteira sem servidor.
      setContas(await listarContasDaMeta());
      setEtapa("escolher");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível falar com a Meta.");
      setEtapa("inicio");
    }
  }

  async function vincular() {
    setErro(null);
    setSalvando(true);
    try {
      aoVincular(await vincularContasDaMeta([...marcadas]));
      aoFechar();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível vincular.");
    } finally {
      setSalvando(false);
    }
  }

  function alternar(id: string) {
    const nova = new Set(marcadas);
    if (nova.has(id)) nova.delete(id);
    else nova.add(id);
    setMarcadas(nova);
  }

  return (
    <dialog
      ref={caixa}
      className={estilos.caixa}
      aria-labelledby={idTitulo}
      onClose={aoFechar}
      onClick={(e) => {
        if (e.target === caixa.current) caixa.current?.close();
      }}
    >
      <div className={estilos.conteudo}>
        <header className={estilos.cabecalho}>
          <div className={estilos.titulos}>
            <h2 id={idTitulo} className={estilos.titulo}>
              {etapa === "escolher" ? "Escolher conta" : "Adicionar conta"}
            </h2>
            <p className={estilos.subtitulo}>
              {etapa === "escolher"
                ? "Estas são as contas que você administra na Meta. O nome e o @ vêm de lá."
                : "O sistema não cadastra a conta por digitação: ela vem da Meta, com o identificador que a API usa."}
            </p>
          </div>
          <button
            type="button"
            className={estilos.fechar}
            onClick={() => caixa.current?.close()}
            aria-label="Fechar"
          >
            <Icone nome="close" tamanho={22} />
          </button>
        </header>

        {etapa !== "escolher" && (
          <>
            <ol className={estilos.passos}>
              {PASSOS.map((p, i) => (
                <li key={p} className={estilos.passo}>
                  <span className={estilos.numero} aria-hidden="true">
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ol>

            <p className={estilos.nota}>
              <Icone nome="warning" tamanho={18} />
              Só aparecem contas Comerciais ou de Criador vinculadas a uma
              Página do Facebook. Conta pessoal a Meta não devolve.
            </p>
          </>
        )}

        {etapa === "escolher" && (
          <>
            <ul className={estilos.lista}>
              {contas.map((c) => {
                const bloqueada = c.jaVinculada || c.impedimento !== null || !c.id;
                const marcada = c.id !== null && marcadas.has(c.id);
                return (
                  <li
                    key={c.pagina}
                    className={`${estilos.item} ${bloqueada ? estilos.bloqueado : ""}`}
                  >
                    <label className={estilos.escolha}>
                      <input
                        type="checkbox"
                        checked={marcada}
                        disabled={bloqueada}
                        onChange={() => c.id && alternar(c.id)}
                        className={estilos.marcador}
                      />
                      <span className={estilos.dados}>
                        <span className={estilos.linhaNome}>
                          <span className={estilos.nome}>{c.nome}</span>
                          {c.jaVinculada && (
                            <span className={estilos.etiqueta}>já vinculada</span>
                          )}
                        </span>
                        <span
                          className={c.usuario ? estilos.usuario : estilos.impedimento}
                        >
                          {c.usuario ?? c.impedimento}
                        </span>
                        <span className={estilos.pagina}>Página: {c.pagina}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <p className={estilos.nota}>
              <Icone nome="open_in_new" tamanho={18} />
              Falta alguma conta? Vincule a Página a uma conta profissional do
              Instagram e volte aqui.
            </p>
          </>
        )}

        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}

        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={() => caixa.current?.close()}>
            Cancelar
          </Botao>

          {etapa === "escolher" ? (
            <Botao onClick={vincular} disabled={salvando || marcadas.size === 0}>
              {salvando
                ? "Vinculando…"
                : /* Sem nada marcado o botão está desabilitado: dizer
                     "Adicionar 0 contas" é contar uma ação que não existe. */
                  marcadas.size === 0
                  ? "Adicionar conta"
                  : marcadas.size === 1
                    ? "Adicionar 1 conta"
                    : `Adicionar ${marcadas.size} contas`}
            </Botao>
          ) : (
            <Botao onClick={irParaMeta} disabled={etapa === "carregando"}>
              {etapa === "carregando" ? "Falando com a Meta…" : "Continuar na Meta"}
            </Botao>
          )}
        </div>
      </div>
    </dialog>
  );
}
