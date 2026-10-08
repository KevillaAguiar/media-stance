import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EstadoVazio } from "../../componentes/EstadoVazio/EstadoVazio";
import { Icone } from "../../componentes/Icone/Icone";
import { ItemComentario } from "../../componentes/ItemComentario/ItemComentario";
import { ListaDeContagens } from "../../componentes/ListaDeContagens/ListaDeContagens";
import { ModalComentario } from "../../componentes/ModalComentario/ModalComentario";
import { Paginacao } from "../../componentes/Paginacao/Paginacao";
import { SeletorDePeriodo } from "../../componentes/SeletorDePeriodo/SeletorDePeriodo";
import {
  obterDemandas,
  type Comentario,
  type FiltrosDeDemandas,
  type PainelDeDemandas,
  type Periodo,
  type RecorteDePeriodo,
} from "../../api";
import estilos from "./Demandas.module.css";

const RECORTES: Record<RecorteDePeriodo, string> = {
  hoje: "Hoje",
  "7dias": "Últimos 7 dias",
  "30dias": "Últimos 30 dias",
  personalizado: "Período personalizado",
};

function intervaloDaUrl(parametros: URLSearchParams): Periodo | null {
  const de = parametros.get("de");
  const ate = parametros.get("ate");
  if (!de || !ate || de > ate) return null;
  return { de, ate };
}

export function Demandas() {
  const [parametros, setParametros] = useSearchParams();

  const filtros: FiltrosDeDemandas = {
    categoria: parametros.get("categoria"),
    localidade: parametros.get("localidade"),
    // Demandas abre em 7 dias, não em hoje: pedido de eleitor se acumula,
    // e um dia só costuma render pouco para encaminhar.
    periodo: (parametros.get("periodo") as RecorteDePeriodo | null) ?? "7dias",
    intervalo: intervaloDaUrl(parametros),
    pagina: Number(parametros.get("pagina") ?? 1),
  };

  const [painel, setPainel] = useState<PainelDeDemandas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Comentario | null>(null);

  const chave = parametros.toString();

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    obterDemandas(filtros)
      .then((r) => ativo && setPainel(r))
      .catch((e: unknown) =>
        ativo &&
        setErro(e instanceof Error ? e.message : "Não foi possível carregar."),
      )
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  function ajustar(mudancas: Record<string, string | null>, voltarAoInicio = true) {
    const novos = new URLSearchParams(parametros);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor === null) novos.delete(chave);
      else novos.set(chave, valor);
    }
    if (voltarAoInicio) novos.delete("pagina");
    setParametros(novos);
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <div>
          <p className={estilos.recorte}>{RECORTES[filtros.periodo]}</p>
          <h1 className={estilos.titulo}>
            Painel de demandas por tema e localidade
          </h1>
        </div>
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
      </header>

      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}

      {!erro && !painel && <p className={estilos.aviso}>Carregando…</p>}

      {!erro && painel && (
        <div aria-busy={carregando} className={estilos.corpo}>
          <div className={estilos.rankings}>
            <ListaDeContagens
              titulo="Por tema"
              unidade="demandas"
              itens={painel.porTema}
              selecionado={filtros.categoria}
              aoEscolher={(rotulo) => ajustar({ categoria: rotulo })}
            />
            <ListaDeContagens
              titulo="Por localidade"
              unidade="demandas"
              itens={painel.porLocalidade}
              selecionado={filtros.localidade}
              aoEscolher={(rotulo) => ajustar({ localidade: rotulo })}
            />
          </div>

          <div className={estilos.foco}>
            <h2 className={estilos.focoTitulo}>
              {painel.foco.rotulo} ({painel.foco.total})
            </h2>
            {(filtros.categoria || filtros.localidade) && (
              <button
                type="button"
                className={estilos.limpar}
                onClick={() => ajustar({ categoria: null, localidade: null })}
              >
                Limpar recorte
                <Icone nome="close" tamanho={18} />
              </button>
            )}
          </div>

          <div aria-live="polite">
            {painel.itens.length === 0 ? (
              <EstadoVazio
                titulo="Nenhuma demanda por aqui"
                descricao="Nenhum pedido de eleitor casa com o recorte escolhido."
              />
            ) : (
              <>
                <ul className={estilos.lista}>
                  {painel.itens.map((comentario) => (
                    <ItemComentario
                      key={comentario.id}
                      comentario={comentario}
                      aoAbrir={setAberto}
                    />
                  ))}
                </ul>

                <Paginacao
                  pagina={painel.pagina}
                  totalDePaginas={painel.totalDePaginas}
                  aoMudar={(n) => ajustar({ pagina: String(n) }, false)}
                />
              </>
            )}
          </div>
        </div>
      )}

      <ModalComentario comentario={aberto} aoFechar={() => setAberto(null)} />
    </div>
  );
}
