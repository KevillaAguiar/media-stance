import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Botao } from "../../componentes/Botao/Botao";
import { Campo } from "../../componentes/Campo/Campo";
import { CampoDeSenha } from "../../componentes/CampoDeSenha/CampoDeSenha";
import { LayoutAuth } from "../../componentes/LayoutAuth/LayoutAuth";
import { entrar as entrarNaApi } from "../../api";
import { useSessao } from "../../sessao/sessao";
import estilos from "./Autenticacao.module.css";

export function Login() {
  const navegar = useNavigate();
  const local = useLocation();
  const { entrar } = useSessao();

  // Para onde a rota protegida mandou de volta, quando houve uma.
  const destino = (local.state as { de?: string } | null)?.de ?? "/";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrarNaApi(email, senha);
      entrar();
      navegar(destino, { replace: true });
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth tema="escuro">
      <header>
        <h1 className={estilos.titulo}>Entrar</h1>
        <p className={estilos.subtitulo}>Acesse sua conta para continuar</p>
      </header>

      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        <Campo
          rotulo="E-mail"
          icone="mail"
          type="email"
          autoComplete="email"
          placeholder="nome@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <CampoDeSenha
            rotulo="Senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p className={estilos.linhaDireita}>
            <Link to="/esqueci-senha" className={estilos.link}>
              Esqueci minha senha
            </Link>
          </p>
        </div>

        {erro && (
          <p role="alert" className={estilos.erro}>
            {erro}
          </p>
        )}

        <Botao largo type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Botao>
      </form>

      <p className={estilos.rodape}>
        Não tem uma conta?{" "}
        <Link to="/criar-conta" className={estilos.link}>
          Criar conta
        </Link>
      </p>
    </LayoutAuth>
  );
}
