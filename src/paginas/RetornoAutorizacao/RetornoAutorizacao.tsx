import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Botao } from "../../componentes/Botao/Botao";
import { EstadoDaConexao } from "../../componentes/EstadoDaConexao/EstadoDaConexao";
import {
  concluirConexaoComInstagram,
  type ConexaoDeConta,
  type MotivoDeErroDeConexao,
} from "../../api";
import estilos from "./RetornoAutorizacao.module.css";

/**
 * Onde a Meta devolve a pessoa depois da aprovação.
 *
 * O que chega aqui é um código de uso único, que sozinho não abre nada.
 * Quem o troca pelo token é o servidor, porque a troca usa a chave
 * secreta do aplicativo — se ela passasse por esta tela, estaria no
 * navegador de qualquer pessoa que abrisse o inspetor.
 */
export function RetornoAutorizacao() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [conexao, setConexao] = useState<ConexaoDeConta | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  // O efeito roda duas vezes em desenvolvimento (StrictMode) e o código da
  // Meta é de uso único: na segunda chamada ele já foi gasto. A trava
  // garante uma troca só.
  const jaTrocou = useRef(false);

  useEffect(() => {
    if (jaTrocou.current) return;
    jaTrocou.current = true;

    const code = parametros.get("code") ?? "";
    const state = parametros.get("state") ?? "";
    const recusou = parametros.get("error");
    const simular = parametros.get("simular") as MotivoDeErroDeConexao | null;

    // A Meta devolve `error=access_denied` quando a pessoa recusa, sem
    // mandar código nenhum. É um caminho normal, não uma falha.
    const motivo: MotivoDeErroDeConexao | null = recusou
      ? "permissao_recusada"
      : simular;

    let ativo = true;
    concluirConexaoComInstagram(recusou ? "recusado" : code, state || "ausente", motivo)
      .then((c) => {
        if (!ativo) return;
        setConexao(c);
        // Some com o código da barra de endereços antes que ele vá parar
        // no histórico, num print de tela ou num link compartilhado.
        window.history.replaceState({}, "", "/autorizacao/retorno");
      })
      .catch(
        (e: unknown) =>
          ativo &&
          setFalha(e instanceof Error ? e.message : "Não foi possível concluir."),
      );

    return () => {
      ativo = false;
    };
  }, [parametros]);

  if (falha) {
    return (
      <div className={estilos.pagina}>
        <p role="alert" className={estilos.erro}>
          {falha}
        </p>
        <Botao onClick={() => navegar("/conectar-conta", { replace: true })}>
          Voltar e tentar de novo
        </Botao>
      </div>
    );
  }

  if (!conexao) {
    return (
      <div className={estilos.pagina}>
        <p role="status" className={estilos.aguardando}>
          Concluindo a conexão…
        </p>
        <p className={estilos.nota}>
          Estamos trocando o código que a Meta devolveu pelo acesso de
          leitura. Não feche esta página.
        </p>
      </div>
    );
  }

  const deuCerto = conexao.estado === "conectada" || conexao.estado === "expirando";

  return (
    <div className={estilos.pagina}>
      <h1 className={estilos.titulo}>
        {deuCerto ? "Pronto" : "A conexão não foi concluída"}
      </h1>

      <EstadoDaConexao
        conexao={conexao}
        aoConectar={() => navegar("/conectar-conta", { replace: true })}
        permiteDesconectar={false}
      />

      {deuCerto && (
        <>
          <p className={estilos.nota}>
            A coleta começa no próximo ciclo. O primeiro resumo aparece
            quando houver comentários classificados.
          </p>
          <Botao onClick={() => navegar("/", { replace: true })}>
            Ir para o resumo do dia
          </Botao>
        </>
      )}
    </div>
  );
}
