import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EstadoVazio } from "../../componentes/EstadoVazio/EstadoVazio";
import { Icone } from "../../componentes/Icone/Icone";
import { ItemComentario } from "../../componentes/ItemComentario/ItemComentario";
import { Menu } from "../../componentes/Menu/Menu";
import { ModalComentario } from "../../componentes/ModalComentario/ModalComentario";
import { Paginacao } from "../../componentes/Paginacao/Paginacao";
import { SeletorDePeriodo } from "../../componentes/SeletorDePeriodo/SeletorDePeriodo";
import {
  obterComentarios,
  type ClasseDePosicionamento,
  type Comentario,
  type FiltrosDeComentarios,
  type PaginaDeComentarios,
  type Periodo,
  type RecorteDePeriodo,
} from "../../api";
import estilos from "./Comentarios.module.css";

const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const CLASSES: { valor: ClasseDePosicionamento | "todos"; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "contra", rotulo: "Contra" },
  { valor: "pedido", rotulo: "Pedido" },
];

/** Só aceita o intervalo quando as duas pontas vieram e estão em ordem. */
function intervaloDaUrl(parametros: URLSearchParams): Periodo | null {
  const de = parametros.get("de");
  const ate = parametros.get("ate");
  if (!de || !ate || de > ate) return null;
  return { de, ate };
}

export function Comentarios() {
  // Os filtros moram na URL, não no estado do componente: assim a tela é
  // recarregável, compartilhável, e o link "Ver comentários" do resumo do
  // dia pode chegar já filtrado por urgentes.
  const [parametros, setParametros] = useSearchParams();

  const filtros: FiltrosDeComentarios = {
    classe: (parametros.get("classe") as ClasseDePosicionamento | null) ?? null,
    tema: parametros.get("tema"),
    periodo: (parametros.get("periodo") as RecorteDePeriodo | null) ?? "hoje",
    intervalo: intervaloDaUrl(parametros),
    apenasUrgentes: parametros.get("urgentes") === "1",
    pagina: Number(parametros.get("pagina") ?? 1),
  };

  const [pagina, setPagina] = useState<PaginaDeComentarios | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Comentario | null>(null);

  const chave = parametros.toString();

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    obterComentarios(filtros)
      .then((resultado) => {
        if (ativo) setPagina(resultado);
      })
      .catch((e: unknown) => {
        if (ativo) {
          setErro(
            e instanceof Error ? e.message : "Não foi possível carregar.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
    // `chave` resume todos os filtros: um objeto novo a cada render
    // dispararia o efeito para sempre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  function ajustar(mudancas: Record<string, string | null>, voltarAoInicio = true) {
    const novos = new URLSearchParams(parametros);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor === null) novos.delete(chave);
      else novos.set(chave, valor);
    }
    // Trocar de filtro sem resetar a página deixaria o usuário na página 4
    // de um resultado que agora tem duas.
    if (voltarAoInicio) novos.delete("pagina");
    setParametros(novos);
  }

  const temas = pagina?.temasDisponiveis ?? [];

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <p className={estilos.data}>{dataLonga.format(new Date())}</p>
        <h1 className={estilos.titulo}>Comentários que exigem resposta</h1>
      </header>

      <div className={estilos.filtros}>
        {CLASSES.map(({ valor, rotulo }) => {
          const ativo =
            valor === "todos" ? filtros.classe === null : filtros.classe === valor;
          return (
            <button
              key={valor}
              type="button"
              className={`${estilos.chip} ${estilos[valor]} ${ativo ? estilos.ativo : ""}`}
              aria-pressed={ativo}
              onClick={() =>
                ajustar({ classe: valor === "todos" ? null : valor })
              }
            >
              {rotulo}
            </button>
          );
        })}

        <Menu
          rotulo="Tema"
          valor={filtros.tema ?? "todos"}
          opcoes={[
            { valor: "todos", rotulo: "todos" },
            ...temas.map((t) => ({ valor: t, rotulo: t })),
          ]}
          aoEscolher={(valor) =>
            ajustar({ tema: valor === "todos" ? null : valor })
          }
        />

        <SeletorDePeriodo
          periodo={filtros.periodo}
          intervalo={filtros.intervalo}
          aoEscolher={(periodo, intervalo) =>
            ajustar({
              periodo,
              de: intervalo?.de ?? null,
              ate: intervalo?.ate ?? null,
            })
          }
        />

        {filtros.apenasUrgentes && (
          <button
            type="button"
            className={`${estilos.chip} ${estilos.urgentes} ${estilos.ativo}`}
            onClick={() => ajustar({ urgentes: null })}
          >
            Apenas urgentes
            <Icone nome="close" tamanho={18} />
          </button>
        )}
      </div>

      <div aria-live="polite" aria-busy={carregando} className={estilos.resultado}>
        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}

        {!erro && carregando && <p className={estilos.aviso}>Carregando…</p>}

        {!erro && !carregando && pagina && pagina.itens.length === 0 && (
          <EstadoVazio
                titulo="Nenhum comentário por aqui"
                descricao="Nenhum comentário casa com os filtros escolhidos."
              />
        )}

        {!erro && !carregando && pagina && pagina.itens.length > 0 && (
          <>
            <p className="apenas-leitor-de-tela">
              {pagina.total} comentários encontrados. Página {pagina.pagina} de{" "}
              {pagina.totalDePaginas}.
            </p>

            <ul className={estilos.lista}>
              {pagina.itens.map((comentario) => (
                <ItemComentario
                  key={comentario.id}
                  comentario={comentario}
                  aoAbrir={setAberto}
                />
              ))}
            </ul>

            <Paginacao
              pagina={pagina.pagina}
              totalDePaginas={pagina.totalDePaginas}
              aoMudar={(n) => ajustar({ pagina: String(n) }, false)}
            />
          </>
        )}
      </div>

      <ModalComentario comentario={aberto} aoFechar={() => setAberto(null)} />
    </div>
  );
}
