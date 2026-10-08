import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlternarTema } from "../../componentes/AlternarTema/AlternarTema";
import { Botao } from "../../componentes/Botao/Botao";
import { Campo } from "../../componentes/Campo/Campo";
import { Icone } from "../../componentes/Icone/Icone";
import { alterarSenha, obterPerfil, type Perfil as DadosDoPerfil } from "../../api";
import { useSessao } from "../../sessao/sessao";
import estilos from "./Perfil.module.css";

const MINIMO_DE_CARACTERES = 8;

export function Perfil() {
  const navegar = useNavigate();
  const { sair } = useSessao();
  const [perfil, setPerfil] = useState<DadosDoPerfil | null>(null);
  const [erroAoCarregar, setErroAoCarregar] = useState<string | null>(null);

  const [trocando, setTrocando] = useState(false);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    let ativo = true;
    obterPerfil()
      .then((p) => ativo && setPerfil(p))
      .catch((e: unknown) =>
        ativo &&
        setErroAoCarregar(
          e instanceof Error ? e.message : "Não foi possível carregar.",
        ),
      );
    return () => {
      ativo = false;
    };
  }, []);

  function limpar() {
    setAtual("");
    setNova("");
    setConfirmacao("");
    setErros({});
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSucesso(false);

    // Validação só de formato. Se a senha atual confere é o servidor que
    // decide — o front não tem como saber, e fingir que tem é como se
    // escrevem verificações que não verificam nada.
    const novos: Record<string, string> = {};
    if (!atual) novos.atual = "Informe a senha atual.";
    if (nova.length < MINIMO_DE_CARACTERES) {
      novos.nova = `A nova senha precisa ter ao menos ${MINIMO_DE_CARACTERES} caracteres.`;
    }
    if (confirmacao !== nova) {
      novos.confirmacao = "A confirmação não é igual à nova senha.";
    }

    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setSalvando(true);
    try {
      await alterarSenha(atual, nova);
      setSucesso(true);
      setTrocando(false);
      limpar();
    } catch (e: unknown) {
      setErros({
        geral: e instanceof Error ? e.message : "Não foi possível salvar.",
      });
    } finally {
      setSalvando(false);
    }
  }

  if (erroAoCarregar) {
    return (
      <p role="alert" className={estilos.erro}>
        {erroAoCarregar}
      </p>
    );
  }

  if (!perfil) return <p className={estilos.aviso}>Carregando…</p>;

  return (
    <div className={estilos.pagina}>
      <div className={estilos.avatar} aria-hidden="true">
        <Icone nome="person" tamanho={28} />
      </div>

      <header className={estilos.identidade}>
        <h1 className={estilos.nome}>{perfil.nome}</h1>
        <p className={estilos.cargo}>{perfil.cargo}</p>
      </header>

      {/* Os dois campos são informativos: trocar e-mail ou religar a conta
          do parlamentar está fora do MVP, e um campo editável que não
          salva é pior do que um campo bloqueado. */}
      <Campo
        rotulo="E-mail"
        icone="mail"
        type="email"
        value={perfil.email}
        readOnly
        disabled
      />

      <Campo
        rotulo="Conta parlamentar vinculada"
        value={perfil.contaVinculada}
        readOnly
        disabled
      />

      {sucesso && (
        <p role="status" className={estilos.sucesso}>
          Senha alterada.
        </p>
      )}

      {!trocando ? (
        <Botao
          variante="secundario"
          className={estilos.alterar}
          onClick={() => {
            setTrocando(true);
            setSucesso(false);
          }}
        >
          Alterar senha
        </Botao>
      ) : (
        <form className={estilos.formulario} onSubmit={enviar} noValidate>
          <h2 className={estilos.subtitulo}>Alterar senha</h2>

          <Campo
            rotulo="Senha atual"
            icone="lock"
            type="password"
            autoComplete="current-password"
            value={atual}
            erro={erros.atual}
            onChange={(e) => setAtual(e.target.value)}
          />

          <Campo
            rotulo="Nova senha"
            icone="lock"
            type="password"
            autoComplete="new-password"
            value={nova}
            erro={erros.nova}
            ajuda={`Ao menos ${MINIMO_DE_CARACTERES} caracteres.`}
            onChange={(e) => setNova(e.target.value)}
          />

          <Campo
            rotulo="Confirmar senha"
            icone="lock"
            type="password"
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

          <div className={estilos.acoes}>
            <Botao
              variante="secundario"
              onClick={() => {
                setTrocando(false);
                limpar();
              }}
            >
              Cancelar
            </Botao>
            <Botao type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar nova senha"}
            </Botao>
          </div>
        </form>
      )}

      {/* Só aparece no mobile: lá a barra inferior já tem quatro alvos em
          375px, e um quinto deixaria todos apertados demais. */}
      <div className={estilos.tema}>
        <h2 className={estilos.subtitulo}>Aparência</h2>
        <AlternarTema contexto="pagina" />
      </div>

      <button
        type="button"
        className={estilos.sair}
        onClick={() => {
          sair();
          navegar("/entrar", { replace: true });
        }}
      >
        <Icone nome="logout" tamanho={20} />
        Sair
      </button>
    </div>
  );
}
