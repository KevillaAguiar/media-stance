import { useEffect, useState, type FormEvent } from "react";
import { Botao } from "../../componentes/Botao/Botao";
import { Campo } from "../../componentes/Campo/Campo";
import { Cartao } from "../../componentes/Cartao/Cartao";
import { Icone } from "../../componentes/Icone/Icone";
import { Tag, type TomDaTag } from "../../componentes/Tag/Tag";
import {
  listarVersoesDaConfiguracao,
  obterConfiguracaoPolitica,
  salvarNovaVersaoDaConfiguracao,
  type ConfiguracaoPolitica as Config,
  type VersaoDeConfiguracao,
} from "../../api";
import estilos from "./ConfiguracaoPolitica.module.css";

/** As três listas de termos, que só diferem no campo e no tom. */
const LISTAS = [
  {
    chave: "aliados" as const,
    titulo: "Aliados",
    tom: "aliado" as TomDaTag,
    ajuda:
      "Os termos exatos pelos quais aparecem nos comentários. Elogio a um aliado conta como apoio ao parlamentar.",
  },
  {
    chave: "adversarios" as const,
    titulo: "Adversários",
    tom: "adversario" as TomDaTag,
    ajuda: "Crítica a um adversário também conta como apoio.",
  },
  {
    chave: "terceirosNaoPoliticos" as const,
    titulo: "Terceiros não políticos",
    tom: "neutro" as TomDaTag,
    ajuda:
      "Pessoas citadas que não são do campo político. Felicitação a elas é neutra, pela regra R9 do manual v5.",
  },
];

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function ConfiguracaoPolitica() {
  const [config, setConfig] = useState<Config | null>(null);
  const [versoes, setVersoes] = useState<VersaoDeConfiguracao[]>([]);
  const [novoTermo, setNovoTermo] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([obterConfiguracaoPolitica(), listarVersoesDaConfiguracao()])
      .then(([c, v]) => {
        if (!ativo) return;
        setConfig(c);
        setVersoes(v);
      })
      .catch((e: unknown) =>
        ativo && setErro(e instanceof Error ? e.message : "Não foi possível carregar."),
      );
    return () => {
      ativo = false;
    };
  }, []);

  function acrescentar(chave: (typeof LISTAS)[number]["chave"]) {
    const termo = (novoTermo[chave] ?? "").trim();
    if (!config || !termo) return;
    // Termo repetido vira duas tags iguais e dois lugares para apagar.
    if (config[chave].includes(termo)) {
      setNovoTermo({ ...novoTermo, [chave]: "" });
      return;
    }
    setConfig({ ...config, [chave]: [...config[chave], termo] });
    setNovoTermo({ ...novoTermo, [chave]: "" });
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!config) return;
    setErro(null);
    setSalvo(null);
    setSalvando(true);
    try {
      const nova = await salvarNovaVersaoDaConfiguracao(config);
      setConfig(nova);
      setVersoes(await listarVersoesDaConfiguracao());
      setSalvo(nova.versao);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (erro && !config) {
    return (
      <p role="alert" className={estilos.erro}>
        {erro}
      </p>
    );
  }
  if (!config) return <p className={estilos.aviso}>Carregando…</p>;

  return (
    <form className={estilos.pagina} onSubmit={enviar} noValidate>
      <header className={estilos.cabecalho}>
        <h1 className={estilos.titulo}>Configuração política</h1>
        <p className={estilos.subtitulo}>
          A tabela de alinhamento que entra no prompt do modelo. Sem ela,
          elogio a aliado é lido como oposição.
        </p>
      </header>

      <Cartao as="section" className={estilos.cartaoVersao}>
        <div className={estilos.identidadeVersao}>
          <div className={estilos.linhaTitulo}>
            <h2 className={estilos.secao}>Versão vigente</h2>
            <span className={estilos.chipVersao}>{config.versao}</span>
          </div>
          <p className={estilos.ajuda}>
            Atualizada em {formatarData(config.atualizadaEm)} por{" "}
            {config.atualizadaPor}
          </p>
        </div>
        <a href="#historico" className={estilos.atalho}>
          Ver histórico
          <Icone nome="arrow_right_alt" tamanho={18} />
        </a>
      </Cartao>

      <Cartao as="section" className={estilos.cartao}>
        <h2 className={estilos.secao}>Partido e conta</h2>

        <div className={estilos.grade}>
          <Campo rotulo="Conta" value={config.alvo} readOnly disabled />
          <Campo
            rotulo="Sigla"
            value={config.partido.sigla}
            onChange={(e) =>
              setConfig({
                ...config,
                partido: { ...config.partido, sigla: e.target.value },
              })
            }
          />
          <Campo
            rotulo="Nº do partido"
            value={config.partido.numeroDoPartido}
            inputMode="numeric"
            onChange={(e) =>
              setConfig({
                ...config,
                partido: { ...config.partido, numeroDoPartido: e.target.value },
              })
            }
          />
          <Campo
            rotulo="Nº do candidato"
            value={config.partido.numeroDoCandidato}
            inputMode="numeric"
            ajuda="Aparece sozinho em comentários de apoio."
            onChange={(e) =>
              setConfig({
                ...config,
                partido: { ...config.partido, numeroDoCandidato: e.target.value },
              })
            }
          />
        </div>

        <Campo
          rotulo="Campo político"
          value={config.campo}
          onChange={(e) => setConfig({ ...config, campo: e.target.value })}
        />
      </Cartao>

      {LISTAS.map(({ chave, titulo, tom, ajuda }) => (
        <Cartao as="section" key={chave} className={estilos.cartao}>
          <div className={estilos.cabecalhoSecao}>
            <h2 className={estilos.secao}>{titulo}</h2>
            <p className={estilos.ajuda}>{ajuda}</p>
          </div>

          {config[chave].length > 0 ? (
            <div className={estilos.tags}>
              {config[chave].map((termo) => (
                <Tag
                  key={termo}
                  texto={termo}
                  tom={tom}
                  aoRemover={() =>
                    setConfig({
                      ...config,
                      [chave]: config[chave].filter((t) => t !== termo),
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <p className={estilos.ajuda}>Nenhum termo cadastrado.</p>
          )}

          {chave === "adversarios" && config.pendenteDeConfirmacao && (
            <p role="status" className={estilos.pendencia}>
              {config.pendenteDeConfirmacao}
            </p>
          )}

          <div className={estilos.acrescentar}>
            <Campo
              rotulo={`Acrescentar a ${titulo.toLowerCase()}`}
              value={novoTermo[chave] ?? ""}
              onChange={(e) => setNovoTermo({ ...novoTermo, [chave]: e.target.value })}
              onKeyDown={(e) => {
                // Enter acrescenta o termo em vez de enviar o formulário:
                // salvar sem querer aqui cria uma versão nova.
                if (e.key === "Enter") {
                  e.preventDefault();
                  acrescentar(chave);
                }
              }}
            />
            <Botao type="button" variante="secundario" onClick={() => acrescentar(chave)}>
              Acrescentar
            </Botao>
          </div>
        </Cartao>
      ))}

      <Cartao as="section" className={estilos.cartao}>
        <div className={estilos.cabecalhoSecao} id="historico">
          <h2 className={estilos.secao}>Histórico de versões</h2>
          <p className={estilos.ajuda}>
            Alterar a configuração cria uma versão nova; a anterior nunca é
            apagada. Cada resultado do modelo guarda a versão que o produziu.
          </p>
        </div>

        <ul className={estilos.versoes}>
          {versoes.map((v) => (
            <li key={v.versao} className={estilos.versao}>
              <span
                className={`${estilos.marcaVersao} ${v.vigente ? estilos.marcaVigente : ""}`}
              >
                {v.versao}
              </span>
              <span className={estilos.detalheVersao}>
                <span className={estilos.resumo}>{v.resumo}</span>
                <span className={estilos.meta}>
                  {formatarData(v.criadaEm)} · {v.criadaPor}
                </span>
              </span>
              <span className={estilos.situacao}>
                {v.vigente ? "Vigente" : "Anterior"}
              </span>
            </li>
          ))}
        </ul>
      </Cartao>

      {salvo && (
        <p role="status" className={estilos.sucesso}>
          Salvo como {salvo}. A versão anterior continua no histórico.
        </p>
      )}
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}

      <div className={estilos.acoes}>
        {/* "Salvar nova versão" e não "Salvar": o texto do botão é o
            modelo de dados aparecendo na tela. Nada é sobrescrito. */}
        <Botao type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar nova versão"}
        </Botao>
      </div>
    </form>
  );
}
