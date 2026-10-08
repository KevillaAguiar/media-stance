import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./componentes/Layout/Layout";
import { Comentarios } from "./paginas/Comentarios/Comentarios";
import { Demandas } from "./paginas/Demandas/Demandas";
import { Perfil } from "./paginas/Perfil/Perfil";
import { ResumoDoDia } from "./paginas/ResumoDoDia/ResumoDoDia";
import { obterConta, type Conta } from "./api";

export default function App() {
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
      </Routes>
    </Layout>
  );
}
