import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./componentes/Layout/Layout";
import { Cadastro } from "./paginas/Cadastro/Cadastro";
import { Comentarios } from "./paginas/Comentarios/Comentarios";
import { ConectarConta } from "./paginas/ConectarConta/ConectarConta";
import { ConfiguracaoCliente } from "./paginas/ConfiguracaoCliente/ConfiguracaoCliente";
import { ConfiguracaoPolitica } from "./paginas/ConfiguracaoPolitica/ConfiguracaoPolitica";
import { Demandas } from "./paginas/Demandas/Demandas";
import { EsqueciSenha } from "./paginas/EsqueciSenha/EsqueciSenha";
import { Login } from "./paginas/Login/Login";
import { Perfil } from "./paginas/Perfil/Perfil";
import { RedefinirSenha } from "./paginas/RedefinirSenha/RedefinirSenha";
import { ResumoDoDia } from "./paginas/ResumoDoDia/ResumoDoDia";
import { RetornoAutorizacao } from "./paginas/RetornoAutorizacao/RetornoAutorizacao";
import { SemPermissao } from "./componentes/SemPermissao/SemPermissao";
import {
  obterConta,
  obterContaEmFoco,
  obterPerfil,
  type Conta,
  type ContaEmFoco,
  type PapelDoUsuario,
} from "./api";
import { useSessao } from "./sessao/sessao";

/**
 * Manda para o login quem não está em sessão.
 *
 * Isto é navegação, não segurança: qualquer pessoa com o console aberto
 * passa por aqui. O que protege dado é o servidor recusar a requisição
 * sem sessão válida — e é lá que a proteção precisa existir.
 */
function ExigeSessao({ children }: { children: ReactNode }) {
  const { emSessao } = useSessao();
  const local = useLocation();

  if (!emSessao) {
    // `state` guarda onde a pessoa queria chegar, para voltar ali depois
    // de entrar em vez de cair sempre no resumo do dia.
    return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * Mostra a tela de acesso restrito quando o papel não permite.
 *
 * ISTO NÃO PROTEGE NADA, pelo mesmo motivo de `ExigeSessao`: quem abre o
 * console passa, e quem chama a API direto nem vem por aqui. O que
 * impede é o servidor responder 403. O que isto faz é não oferecer à
 * pessoa um caminho que vai terminar em recusa.
 *
 * Enquanto o papel não chegou, nada é decidido: mostrar "acesso
 * restrito" por um instante e depois a tela de verdade pisca na cara de
 * quem tem permissão.
 */
function ExigePapel({
  papel,
  permitido,
  area,
  children,
}: {
  papel: PapelDoUsuario | null;
  permitido: PapelDoUsuario;
  area: string;
  children: ReactNode;
}) {
  if (papel === null) return null;
  if (papel !== permitido) return <SemPermissao area={area} />;
  return <>{children}</>;
}

function AreaInterna() {
  const [conta, setConta] = useState<Conta | null>(null);
  const [papel, setPapel] = useState<PapelDoUsuario | null>(null);
  const [foco, setFoco] = useState<ContaEmFoco | null>(null);

  // A conta pertence à sessão, não a uma tela: fica aqui porque a
  // navegação a usa em todas elas. Cada página busca os próprios dados.
  useEffect(() => {
    let ativo = true;
    obterConta()
      .then((c) => ativo && setConta(c))
      .catch(() => {
        /* A navegação cai no nome do produto; nenhuma tela depende disto. */
      });
    return () => {
      ativo = false;
    };
  }, []);

  // O papel vem do perfil e vale para a navegação e para as rotas, então
  // mora aqui e não dentro de cada tela.
  useEffect(() => {
    let ativo = true;
    obterPerfil()
      .then((p) => ativo && setPapel(p.papel))
      .catch(() => ativo && setPapel("assessor"));
    return () => {
      ativo = false;
    };
  }, []);

  // Qual conta as telas mostram. Vive na sessão do servidor; aqui é só a
  // cópia que a interface desenha.
  useEffect(() => {
    let ativo = true;
    obterContaEmFoco()
      .then((c) => ativo && setFoco(c))
      .catch(() => {
        /* Sem foco o seletor não aparece; as telas seguem funcionando. */
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <Layout conta={conta} papel={papel} foco={foco} aoTrocarConta={setFoco}>
      <Routes>
        <Route path="/" element={<ResumoDoDia />} />
        <Route path="/comentarios" element={<Comentarios />} />
        <Route path="/demandas" element={<Demandas />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route
          path="/conectar-conta"
          element={
            <ExigePapel papel={papel} permitido="administrador" area="Conectar conta">
              <ConectarConta />
            </ExigePapel>
          }
        />
        <Route
          path="/configuracoes/cliente"
          element={
            <ExigePapel papel={papel} permitido="administrador" area="O cadastro de cliente">
              <ConfiguracaoCliente />
            </ExigePapel>
          }
        />
        <Route
          path="/configuracoes/politica"
          element={
            <ExigePapel papel={papel} permitido="administrador" area="A configuração política">
              <ConfiguracaoPolitica />
            </ExigePapel>
          }
        />
        {/* O retorno da Meta é rota interna de propósito: só faz sentido
            para quem já está em sessão, e assim quem cair aqui sem sessão
            passa pelo login e volta para cá em vez de ver uma tela morta. */}
        <Route path="/autorizacao/retorno" element={<RetornoAutorizacao />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Públicas: sem navegação lateral, porque não há para onde navegar
          antes de entrar. */}
      <Route path="/entrar" element={<Login />} />
      <Route path="/criar-conta" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      <Route
        path="*"
        element={
          <ExigeSessao>
            <AreaInterna />
          </ExigeSessao>
        }
      />
    </Routes>
  );
}
