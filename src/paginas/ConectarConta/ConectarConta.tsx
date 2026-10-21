import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EstadoDaConexao } from "../../componentes/EstadoDaConexao/EstadoDaConexao";
import { Icone } from "../../componentes/Icone/Icone";
import {
  USANDO_MOCK,
  desconectarInstagram,
  iniciarConexaoComInstagram,
  obterConexaoComInstagram,
  simularEstadoDaConexao,
  type ConexaoDeConta,
  type EstadoDaConexao as Estado,
} from "../../api";
import estilos from "./ConectarConta.module.css";

const PERMISSOES_PEDIDAS = [
  "Ler o perfil público da conta",
  "Ler os comentários das publicações",
  "Acessar a Página do Facebook vinculada",
];

const ESTADOS_PARA_DEMO: { estado: Estado; rotulo: string }[] = [
  { estado: "ausente", rotulo: "Sem conexão" },
  { estado: "conectada", rotulo: "Conectada" },
  { estado: "expirando", rotulo: "Expirando" },
  { estado: "erro", rotulo: "Com erro" },
];

export function ConectarConta() {
  const navegar = useNavigate();
  const [conexao, setConexao] = useState<ConexaoDeConta | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    obterConexaoComInstagram()
      .then((c) => ativo && setConexao(c))
      .catch(
        (e: unknown) =>
          ativo &&
          setErro(e instanceof Error ? e.message : "Não foi possível carregar."),
      );
    return () => {
      ativo = false;
    };
  }, []);

  async function conectar() {
    setOcupado(true);
    setErro(null);
    try {
      const { urlDeAutorizacao } = await iniciarConexaoComInstagram();
      // Sai da aplicação de propósito: quem autentica é a Meta, na página
      // dela. Abrir isso dentro de um iframe nosso seria pedir a senha da
      // pessoa numa moldura que a gente controla, que é a forma clássica
      // de phishing — e a Meta recusa, com razão.
      window.location.assign(urlDeAutorizacao);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível iniciar.");
      setOcupado(false);
    }
  }

  async function desconectar() {
    setOcupado(true);
    try {
      await desconectarInstagram();
      setConexao(await obterConexaoComInstagram());
    } finally {
      setOcupado(false);
    }
  }

  if (erro) {
    return (
      <p role="alert" className={estilos.erro}>
        {erro}
      </p>
    );
  }

  if (!conexao) return <p className={estilos.aviso}>Carregando…</p>;

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <h1 className={estilos.titulo}>Conectar conta do Instagram</h1>
        <p className={estilos.subtitulo}>
          Sem esta conexão o sistema não recebe comentário nenhum: a API só
          entrega as contas que o administrador autorizou.
        </p>
      </header>

      <EstadoDaConexao
        conexao={conexao}
        aoConectar={conectar}
        aoDesconectar={desconectar}
        ocupado={ocupado}
      />

      <section className={estilos.explicacao}>
        <h2 className={estilos.subtituloSecao}>O que vai acontecer</h2>
        <ol className={estilos.passos}>
          <li>Você vai para o login da Meta, na página dela.</li>
          <li>Lá você aprova as permissões que o sistema pede.</li>
          <li>Você volta para cá e a conta aparece conectada.</li>
        </ol>

        <h2 className={estilos.subtituloSecao}>O que o sistema vai poder ver</h2>
        <ul className={estilos.permissoes}>
          {PERMISSOES_PEDIDAS.map((p) => (
            <li key={p}>
              <Icone nome="check_circle" tamanho={18} />
              {p}
            </li>
          ))}
        </ul>
        <p className={estilos.nota}>
          O sistema só lê. Ele não publica, não responde e não apaga nada em
          nome da conta.
        </p>

        <h2 className={estilos.subtituloSecao}>Antes de começar</h2>
        <p className={estilos.nota}>
          A conta precisa ser Comercial ou de Criador de Conteúdo, e estar
          vinculada a uma Página do Facebook. Conta pessoal não aparece na
          lista — é o motivo mais comum de a conexão falhar.
        </p>
      </section>

      {/* Painel de demonstração. Sai junto com o mock: quando a API real
          entrar, `USANDO_MOCK` vira falso e este bloco deixa de existir
          no pacote, porque o empacotador descarta o ramo morto. */}
      {USANDO_MOCK && (
        <section className={estilos.demo}>
          <h2 className={estilos.subtituloSecao}>
            Estados da tela <span className={estilos.marcaDemo}>demonstração</span>
          </h2>
          <p className={estilos.nota}>
            Força cada estado sem precisar esperar o acesso expirar nem
            quebrar uma conta de propósito.
          </p>
          <div className={estilos.botoesDemo}>
            {ESTADOS_PARA_DEMO.map(({ estado, rotulo }) => (
              <button
                key={estado}
                type="button"
                className={estilos.botaoDemo}
                onClick={async () => setConexao(await simularEstadoDaConexao(estado))}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </section>
      )}

      <button type="button" className={estilos.pular} onClick={() => navegar("/")}>
        Conectar depois
        <Icone nome="arrow_right_alt" tamanho={20} />
      </button>
    </div>
  );
}
