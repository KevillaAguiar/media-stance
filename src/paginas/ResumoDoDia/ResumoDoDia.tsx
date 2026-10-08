import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../componentes/Badge/Badge";
import { Cartao } from "../../componentes/Cartao/Cartao";
import { CartaoEstatistica } from "../../componentes/CartaoEstatistica/CartaoEstatistica";
import { EstadoVazio } from "../../componentes/EstadoVazio/EstadoVazio";
import { Icone } from "../../componentes/Icone/Icone";
import { obterResumoDoDia, type ResumoDoDia as Resumo } from "../../api";
import estilos from "./ResumoDoDia.module.css";

const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const porcentagem = new Intl.NumberFormat("pt-BR", { style: "percent" });
const umaCasa = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
});
const inteiro = new Intl.NumberFormat("pt-BR");

export function ResumoDoDia() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    obterResumoDoDia()
      .then((r) => ativo && setResumo(r))
      .catch((e: unknown) =>
        ativo &&
        setErro(e instanceof Error ? e.message : "Não foi possível carregar."),
      );
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) {
    return (
      <p role="alert" className={estilos.erro}>
        {erro}
      </p>
    );
  }

  if (!resumo) {
    return (
      <p className={estilos.aviso} aria-busy="true">
        Carregando…
      </p>
    );
  }

  const {
    data,
    classificados,
    engajamentoAfetivo,
    urgentes,
    publicacaoComMaiorAtrito,
    janelaDias,
    minimoDeComentariosParaTaxa,
  } = resumo;

  // "Nada coletado" é diferente de "zero a favor": sem nenhum comentário
  // não há denominador, e quatro cartões zerados não explicam por quê.
  const totalColetado =
    classificados.reduce((soma, c) => soma + c.quantidade, 0) +
    engajamentoAfetivo.quantidade;

  if (totalColetado === 0) {
    return (
      <div className={estilos.pagina}>
        <header className={estilos.cabecalho}>
          <p className={estilos.data}>
            <time dateTime={data}>{dataLonga.format(new Date(data))}</time>
          </p>
          <h1 className={estilos.titulo}>Resumo do dia</h1>
        </header>

        <EstadoVazio
          titulo="Nenhum comentário coletado ainda hoje"
          descricao="A coleta roda automaticamente ao longo do dia."
        />
      </div>
    );
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <p className={estilos.data}>
          <time dateTime={data}>{dataLonga.format(new Date(data))}</time>
        </p>
        <h1 className={estilos.titulo}>Resumo do dia</h1>
      </header>

      <ul className={estilos.estatisticas}>
        {classificados.map((contagem) => (
          <CartaoEstatistica key={contagem.classe} contagem={contagem} />
        ))}
      </ul>

      {/* Engajamento afetivo fica fora do denominador das proporções acima.
          No piloto foram 49% do corpus — somar aqui distorceria todos os
          números do cartão anterior. */}
      <Cartao className={estilos.engajamento}>
        <Badge tom="engajamento_afetivo">Engajamento afetivo</Badge>
        <p>
          {inteiro.format(engajamentoAfetivo.quantidade)} comentários (
          {porcentagem.format(engajamentoAfetivo.proporcao)}) são compostos
          apenas de emojis — fora da contagem de posicionamento
        </p>
      </Cartao>

      {urgentes > 0 && (
        <div className={estilos.urgente}>
          <Badge tom="urgente" variante="sobreFaixa">
            Urgente
          </Badge>
          <p className={estilos.urgenteTexto}>
            {urgentes}{" "}
            {urgentes === 1
              ? "comentário exige resposta imediata hoje"
              : "comentários exigem resposta imediata hoje"}
          </p>
          <Link to="/comentarios?urgentes=1" className={estilos.urgenteLink}>
            Ver comentários
            <Icone nome="arrow_right_alt" tamanho={20} />
          </Link>
        </div>
      )}

      {publicacaoComMaiorAtrito && (
        <Cartao as="section" className={estilos.atrito}>
          <h2 className="apenas-leitor-de-tela">Publicação com maior atrito</h2>
          {publicacaoComMaiorAtrito.miniatura ? (
            <img
              className={estilos.miniatura}
              src={publicacaoComMaiorAtrito.miniatura}
              alt=""
            />
          ) : (
            <div className={estilos.miniatura} aria-hidden="true" />
          )}
          <div className={estilos.atritoTexto}>
            <p className={estilos.atritoRotulo}>Publicação com maior atrito</p>
            <p className={estilos.atritoLegenda}>
              &ldquo;{publicacaoComMaiorAtrito.legenda}&rdquo;
            </p>
            <p className={estilos.atritoMeta}>
              Taxa de atrito: {umaCasa.format(publicacaoComMaiorAtrito.taxaDeAtrito)} ·{" "}
              {inteiro.format(publicacaoComMaiorAtrito.comentarios)} comentários
            </p>
          </div>
        </Cartao>
      )}

      {/* Estas três linhas não são enfeite: sem elas um número desta tela
          pode ser lido como medida de opinião pública, que é justamente o
          que o projeto afirma não produzir. */}
      <Cartao as="section" variante="sutil" className={estilos.notas}>
        <h2 className="apenas-leitor-de-tela">Como ler estes números</h2>
        <ul>
          <li>
            Proporções calculadas sobre janela de {janelaDias} dias — itens
            acionáveis são apenas os de hoje.
          </li>
          <li>
            Publicações com menos de {minimoDeComentariosParaTaxa} comentários
            não entram no cálculo de taxa.
          </li>
          <li>
            Nenhuma proporção deve ser lida como medida de opinião pública.
          </li>
        </ul>
      </Cartao>
    </div>
  );
}
