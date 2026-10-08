import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Botao } from "../../componentes/Botao/Botao";
import { Campo } from "../../componentes/Campo/Campo";
import { LayoutAuth } from "../../componentes/LayoutAuth/LayoutAuth";
import { solicitarRedefinicao } from "../../api";
import estilos from "../Login/Autenticacao.module.css";

export function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!email.includes("@")) {
      setErro("Informe um e-mail válido.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await solicitarRedefinicao(email);
      setEnviado(true);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth variante="foco" tema="escuro">
      <header>
        <h1 className={estilos.titulo}>Esqueci minha senha</h1>
        <p className={estilos.subtitulo}>
          Informe seu e-mail e enviaremos um link para você redefinir sua senha.
        </p>
      </header>

      {enviado ? (
        /* A confirmação não diz se o e-mail existe na base. Dizer "não
           encontramos esse e-mail" entrega quais endereços têm conta, e é
           assim que se levanta lista de usuários de um sistema. */
        <div className={estilos.sucesso} role="status">
          <p className={estilos.sucessoTitulo}>Verifique seu e-mail</p>
          <p>
            Se houver uma conta para <strong>{email}</strong>, o link de
            redefinição chega em alguns minutos. Confira também o spam.
          </p>
        </div>
      ) : (
        <form className={estilos.formulario} onSubmit={enviar} noValidate>
          <Campo
            rotulo="E-mail"
            icone="mail"
            type="email"
            autoComplete="email"
            placeholder="nome@exemplo.com"
            value={email}
            erro={erro ?? undefined}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Botao largo type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar"}
          </Botao>
        </form>
      )}

      <p className={estilos.centralizado}>
        <Link to="/entrar" className={estilos.link}>
          Voltar para o login
        </Link>
      </p>
    </LayoutAuth>
  );
}
