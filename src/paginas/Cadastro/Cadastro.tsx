import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Botao } from "../../componentes/Botao/Botao";
import { Campo } from "../../componentes/Campo/Campo";
import { CampoDeSenha } from "../../componentes/CampoDeSenha/CampoDeSenha";
import { LayoutAuth } from "../../componentes/LayoutAuth/LayoutAuth";
import { criarConta } from "../../api";
import { useSessao } from "../../sessao/sessao";
import estilos from "../Login/Autenticacao.module.css";

const MINIMO_DE_CARACTERES = 8;

export function Cadastro() {
  const navegar = useNavigate();
  const { entrar } = useSessao();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const novos: Record<string, string> = {};
    if (!nome.trim()) novos.nome = "Informe seu nome.";
    if (!email.includes("@")) novos.email = "Informe um e-mail válido.";
    if (senha.length < MINIMO_DE_CARACTERES) {
      novos.senha = `A senha precisa ter ao menos ${MINIMO_DE_CARACTERES} caracteres.`;
    }
    if (confirmacao !== senha) {
      novos.confirmacao = "A confirmação não é igual à senha.";
    }

    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setEnviando(true);
    try {
      await criarConta({ nome, email, senha });
      entrar();
      navegar("/", { replace: true });
    } catch (e: unknown) {
      setErros({
        geral: e instanceof Error ? e.message : "Não foi possível criar a conta.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth tema="escuro">
      <header>
        <h1 className={estilos.titulo}>Criar conta</h1>
        <p className={estilos.subtitulo}>Leva menos de um minuto</p>
      </header>

      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        <Campo
          rotulo="Nome completo"
          icone="account_circle"
          autoComplete="name"
          placeholder="Seu nome"
          value={nome}
          erro={erros.nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Campo
          rotulo="E-mail"
          icone="mail"
          type="email"
          autoComplete="email"
          placeholder="nome@exemplo.com"
          value={email}
          erro={erros.email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <CampoDeSenha
          rotulo="Senha"
          autoComplete="new-password"
          value={senha}
          erro={erros.senha}
          ajuda={`Ao menos ${MINIMO_DE_CARACTERES} caracteres.`}
          onChange={(e) => setSenha(e.target.value)}
        />

        <CampoDeSenha
          rotulo="Confirmar senha"
          autoComplete="new-password"
          value={confirmacao}
          erro={erros.confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />

        {erros.geral && (
          <p role="alert" className={estilos.erro}>
            {erros.geral}
          </p>
        )}

        {/* O Figma traz "Entrar" neste botão, mas o rótulo de um botão
            precisa dizer o que ele faz. */}
        <Botao largo type="submit" disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </Botao>
      </form>

      <p className={estilos.rodape}>
        Já tem conta?{" "}
        <Link to="/entrar" className={estilos.link}>
          Entrar
        </Link>
      </p>
    </LayoutAuth>
  );
}
