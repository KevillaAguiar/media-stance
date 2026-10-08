import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Botao } from "../../componentes/Botao/Botao";
import { CampoDeSenha } from "../../componentes/CampoDeSenha/CampoDeSenha";
import { LayoutAuth } from "../../componentes/LayoutAuth/LayoutAuth";
import { redefinirSenha } from "../../api";
import estilos from "../Login/Autenticacao.module.css";

const MINIMO_DE_CARACTERES = 8;

export function RedefinirSenha() {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  // O token vem do link do e-mail: /redefinir-senha?token=...
  const token = parametros.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const novos: Record<string, string> = {};
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
      await redefinirSenha(token, senha);
      // Redefinir não abre sessão: quem acabou de trocar a senha entra com
      // ela, e isso confirma que a nova senha funciona.
      navegar("/entrar", { replace: true });
    } catch (e: unknown) {
      setErros({
        geral: e instanceof Error ? e.message : "Não foi possível redefinir.",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <LayoutAuth variante="foco">
      <header>
        <h1 className={estilos.titulo}>Redefinir senha</h1>
      </header>

      <form className={estilos.formulario} onSubmit={enviar} noValidate>
        <CampoDeSenha
          rotulo="Nova senha"
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

        <Botao largo type="submit" disabled={enviando}>
          {enviando ? "Redefinindo…" : "Redefinir senha"}
        </Botao>
      </form>

      <p className={estilos.centralizado}>
        <Link to="/entrar" className={estilos.link}>
          Voltar para o login
        </Link>
      </p>
    </LayoutAuth>
  );
}
