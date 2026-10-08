import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./componentes/Layout/Layout";
import { Cadastro } from "./paginas/Cadastro/Cadastro";
import { Comentarios } from "./paginas/Comentarios/Comentarios";
import { Demandas } from "./paginas/Demandas/Demandas";
import { EsqueciSenha } from "./paginas/EsqueciSenha/EsqueciSenha";
import { Login } from "./paginas/Login/Login";
import { Perfil } from "./paginas/Perfil/Perfil";
import { RedefinirSenha } from "./paginas/RedefinirSenha/RedefinirSenha";
import { ResumoDoDia } from "./paginas/ResumoDoDia/ResumoDoDia";
import { obterConta, type Conta } from "./api";
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

function AreaInterna() {
  const [conta, setConta] = useState<Conta | null>(null);

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

  return (
    <Layout conta={conta}>
      <Routes>
        <Route path="/" element={<ResumoDoDia />} />
        <Route path="/comentarios" element={<Comentarios />} />
        <Route path="/demandas" element={<Demandas />} />
        <Route path="/perfil" element={<Perfil />} />
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
