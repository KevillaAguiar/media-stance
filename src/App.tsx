import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./componentes/Layout/Layout";
import { ResumoDoDia } from "./paginas/ResumoDoDia/ResumoDoDia";
import { obterResumoDoDia, type ResumoDoDia as Resumo } from "./api";
import estilos from "./App.module.css";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "pronto"; resumo: Resumo }
  | { situacao: "erro"; mensagem: string };

export default function App() {
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });

  useEffect(() => {
    let ativo = true;

    obterResumoDoDia()
      .then((resumo) => {
        if (ativo) setEstado({ situacao: "pronto", resumo });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        setEstado({
          situacao: "erro",
          mensagem:
            erro instanceof Error ? erro.message : "Não foi possível carregar.",
        });
      });

    // Evita atualizar estado depois que o componente saiu de cena.
    return () => {
      ativo = false;
    };
  }, []);

  const conta = estado.situacao === "pronto" ? estado.resumo.conta : null;

  return (
    <Layout conta={conta}>
      {/* aria-live para que a troca de carregando → conteúdo seja anunciada
          por leitor de tela, não só vista. */}
      <div aria-live="polite" aria-busy={estado.situacao === "carregando"}>
        {estado.situacao === "carregando" && (
          <p className={estilos.aviso}>Carregando…</p>
        )}

        {estado.situacao === "erro" && (
          <p className={estilos.erro} role="alert">
            {estado.mensagem}
          </p>
        )}

        {estado.situacao === "pronto" && (
          <Routes>
            <Route path="/" element={<ResumoDoDia resumo={estado.resumo} />} />
            <Route path="/comentarios" element={<EmBreve nome="Comentários" />} />
            <Route path="/demandas" element={<EmBreve nome="Demandas" />} />
            <Route path="/perfil" element={<EmBreve nome="Perfil" />} />
          </Routes>
        )}
      </div>
    </Layout>
  );
}

function EmBreve({ nome }: { nome: string }) {
  return (
    <>
      <h1 className={estilos.titulo}>{nome}</h1>
      <p className={estilos.aviso}>Tela ainda não implementada.</p>
    </>
  );
}
