import { useEffect, useState, type FormEvent } from "react";
import { Botao } from "../../componentes/Botao/Botao";
import { Campo } from "../../componentes/Campo/Campo";
import { Cartao } from "../../componentes/Cartao/Cartao";
import { Voltar } from "../../componentes/Voltar/Voltar";
import { Icone } from "../../componentes/Icone/Icone";
import {
  obterCliente,
  salvarCliente,
  type Cliente,
  type TipoDeCliente,
} from "../../api";
import estilos from "./ConfiguracaoCliente.module.css";

const TIPOS: { valor: TipoDeCliente; titulo: string; descricao: string }[] = [
  { valor: "mandato", titulo: "Mandato", descricao: "Um parlamentar e suas contas." },
  { valor: "agencia", titulo: "Agência", descricao: "Atende vários mandatos." },
];

export function ConfiguracaoCliente() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    let ativo = true;
    obterCliente()
      .then((c) => ativo && setCliente(c))
      .catch((e: unknown) =>
        ativo && setErro(e instanceof Error ? e.message : "Não foi possível carregar."),
      );
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!cliente) return;
    setErro(null);
    setSalvo(false);
    setSalvando(true);
    try {
      setCliente(await salvarCliente(cliente));
      setSalvo(true);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (erro && !cliente) {
    return (
      <p role="alert" className={estilos.erro}>
        {erro}
      </p>
    );
  }
  if (!cliente) return <p className={estilos.aviso}>Carregando…</p>;

  return (
    <form className={estilos.pagina} onSubmit={enviar} noValidate>
      <Voltar destino="/perfil" rotuloDoDestino="o perfil" />

      <header className={estilos.cabecalho}>
        <h1 className={estilos.titulo}>Cadastro de cliente</h1>
        <p className={estilos.subtitulo}>
          Um cliente é uma agência ou um mandato, e cada um acompanha uma ou
          mais contas do Instagram.
        </p>
      </header>

      <Cartao as="section" className={estilos.cartao}>
        <h2 className={estilos.secao}>Dados do cliente</h2>

        <Campo
          rotulo="Nome do cliente"
          value={cliente.nome}
          onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
        />

        <fieldset className={estilos.tipo}>
          <legend className={estilos.legenda}>Tipo</legend>
          {/* Dois cartões de rádio em vez de um seletor: com duas opções,
              um dropdown esconde metade da escolha atrás de um clique. */}
          <div className={estilos.opcoes}>
            {TIPOS.map(({ valor, titulo, descricao }) => {
              const marcado = cliente.tipo === valor;
              return (
                <label
                  key={valor}
                  className={`${estilos.opcao} ${marcado ? estilos.marcada : ""}`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={valor}
                    checked={marcado}
                    onChange={() => setCliente({ ...cliente, tipo: valor })}
                    className={estilos.radio}
                  />
                  <span className={estilos.opcaoTitulo}>{titulo}</span>
                  <span className={estilos.opcaoDescricao}>{descricao}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </Cartao>

      <Cartao as="section" className={estilos.cartao}>
        <div className={estilos.cabecalhoSecao}>
          <h2 className={estilos.secao}>Contas vinculadas</h2>
          <p className={estilos.ajuda}>
            Cada conta precisa ser conectada à Meta separadamente.
          </p>
        </div>

        <ul className={estilos.contas}>
          {cliente.contas.map((conta) => (
            <li key={conta.id} className={estilos.conta}>
              <span className={estilos.avatar} aria-hidden="true">
                <Icone nome="person" tamanho={20} />
              </span>

              <span className={estilos.identidade}>
                <span className={estilos.contaNome}>{conta.nome}</span>
                <span className={estilos.contaUsuario}>{conta.usuario}</span>
              </span>

              <span
                className={`${estilos.estado} ${
                  conta.conectada ? estilos.conectada : estilos.pendente
                }`}
              >
                {conta.conectada ? "Conectada" : "Não conectada"}
              </span>

              <button
                type="button"
                className={estilos.remover}
                onClick={() =>
                  setCliente({
                    ...cliente,
                    contas: cliente.contas.filter((c) => c.id !== conta.id),
                  })
                }
              >
                Remover
              </button>
            </li>
          ))}
        </ul>

        {cliente.contas.length === 0 && (
          <p className={estilos.ajuda}>
            Sem conta vinculada o sistema não recebe comentário nenhum.
          </p>
        )}

        <Botao
          type="button"
          variante="secundario"
          onClick={() =>
            setCliente({
              ...cliente,
              contas: [
                ...cliente.contas,
                {
                  id: `conta_${Date.now()}`,
                  nome: "Nova conta",
                  usuario: "@",
                  conectada: false,
                },
              ],
            })
          }
        >
          Adicionar conta
        </Botao>
      </Cartao>

      {salvo && (
        <p role="status" className={estilos.sucesso}>
          Cliente salvo.
        </p>
      )}
      {erro && (
        <p role="alert" className={estilos.erro}>
          {erro}
        </p>
      )}

      <div className={estilos.acoes}>
        <Botao type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar cliente"}
        </Botao>
      </div>
    </form>
  );
}
