import { Botao } from "../Botao/Botao";
import { Cartao } from "../Cartao/Cartao";
import { Icone, type NomeDeIcone } from "../Icone/Icone";
import type { ConexaoDeConta, MotivoDeErroDeConexao } from "../../api";
import estilos from "./EstadoDaConexao.module.css";

/**
 * O que a pessoa precisa FAZER em cada erro, não o que aconteceu.
 *
 * "Erro ao conectar" é informação para quem escreveu o código. Quem está
 * do outro lado quer saber se o problema é dela, se tem conserto e qual.
 * Os dois primeiros são de longe os mais comuns — conta pessoal e conta
 * sem Página respondem pela maioria das tentativas que falham.
 */
const MENSAGENS: Record<MotivoDeErroDeConexao, string> = {
  conta_nao_profissional:
    "A conta precisa ser Comercial ou de Criador de Conteúdo. " +
    "Converta nas configurações do Instagram e tente de novo.",
  sem_pagina_vinculada:
    "A conta não está vinculada a uma Página do Facebook. " +
    "Vincule a Página e tente de novo.",
  permissao_recusada:
    "As permissões não foram concedidas. Sem elas não dá para ler " +
    "os comentários da conta.",
  state_invalido:
    "O retorno não confere com o pedido que saiu daqui. " +
    "Por segurança, comece de novo.",
  token_expirado:
    "O acesso expirou. Reconecte a conta para a coleta voltar a rodar.",
  falha_do_provedor:
    "Não foi possível falar com a Meta agora. Tente de novo em instantes.",
};

const APARENCIA: Record<
  ConexaoDeConta["estado"],
  { icone: NomeDeIcone; classe: string; titulo: string }
> = {
  ausente: { icone: "link", classe: "neutro", titulo: "Nenhuma conta conectada" },
  conectada: { icone: "check_circle", classe: "boa", titulo: "Conta conectada" },
  expirando: { icone: "schedule", classe: "atencao", titulo: "Acesso expirando" },
  erro: { icone: "error", classe: "ruim", titulo: "Não foi possível conectar" },
};

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  // "AAAA-MM-DD" sem hora vira UTC no construtor e volta um dia atrás em
  // fuso negativo. Montando por partes, a data fica local e correta.
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return DATA.format(new Date(ano, mes - 1, dia));
}

export interface EstadoDaConexaoProps {
  conexao: ConexaoDeConta;
  /** Dispara o fluxo de autorização. */
  aoConectar: () => void;
  aoDesconectar?: () => void;
  ocupado?: boolean;
  /** Esconde o botão de desconectar onde ele não faz sentido. */
  permiteDesconectar?: boolean;
}

export function EstadoDaConexao({
  conexao,
  aoConectar,
  aoDesconectar,
  ocupado = false,
  permiteDesconectar = true,
}: EstadoDaConexaoProps) {
  const { icone, classe, titulo } = APARENCIA[conexao.estado];
  const conectado = conexao.estado === "conectada" || conexao.estado === "expirando";
  const expira = formatarData(conexao.expiraEm);

  return (
    <Cartao as="section" className={estilos.cartao}>
      <div className={`${estilos.cabecalho} ${estilos[classe]}`}>
        <Icone nome={icone} tamanho={22} />
        <h2 className={estilos.titulo}>{titulo}</h2>
      </div>

      {conexao.estado === "ausente" && (
        <p className={estilos.texto}>
          Conecte a conta do Instagram do parlamentar para o sistema começar
          a coletar os comentários. A conta precisa ser profissional e estar
          vinculada a uma Página do Facebook.
        </p>
      )}

      {conectado && (
        <dl className={estilos.detalhes}>
          <div>
            <dt>Conta</dt>
            <dd>{conexao.usuario}</dd>
          </div>
          {expira && (
            <div>
              <dt>Acesso válido até</dt>
              <dd>
                {expira}
                {conexao.diasParaExpirar !== null && (
                  <span className={estilos.dias}>
                    {" "}
                    ({conexao.diasParaExpirar}{" "}
                    {conexao.diasParaExpirar === 1 ? "dia" : "dias"})
                  </span>
                )}
              </dd>
            </div>
          )}
          {conexao.autorizadaPor && (
            <div>
              <dt>Autorizada por</dt>
              <dd>{conexao.autorizadaPor}</dd>
            </div>
          )}
          {conexao.permissoes.length > 0 && (
            <div>
              <dt>Permissões concedidas</dt>
              <dd>{conexao.permissoes.length} permissões de leitura</dd>
            </div>
          )}
        </dl>
      )}

      {conexao.estado === "expirando" && (
        <p role="status" className={estilos.aviso}>
          Quando o acesso expirar, a coleta para. Reconectar agora evita a
          interrupção.
        </p>
      )}

      {conexao.estado === "erro" && conexao.erro && (
        <p role="alert" className={estilos.texto}>
          {MENSAGENS[conexao.erro]}
        </p>
      )}

      <div className={estilos.acoes}>
        <Botao onClick={aoConectar} disabled={ocupado}>
          {ocupado
            ? "Abrindo…"
            : conectado
              ? "Reconectar"
              : conexao.estado === "erro"
                ? "Tentar de novo"
                : "Conectar conta"}
        </Botao>

        {conectado && permiteDesconectar && aoDesconectar && (
          <Botao variante="secundario" onClick={aoDesconectar} disabled={ocupado}>
            Desconectar
          </Botao>
        )}
      </div>
    </Cartao>
  );
}
