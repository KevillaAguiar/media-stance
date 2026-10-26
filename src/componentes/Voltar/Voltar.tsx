import { useLocation, useNavigate } from "react-router-dom";
import { Icone } from "../Icone/Icone";
import estilos from "./Voltar.module.css";

export interface VoltarProps {
  /** Para onde ir quando não há tela anterior dentro do produto. */
  destino: string;
  /** O nome desse destino, para o rótulo dizer onde a pessoa vai cair. */
  rotuloDoDestino: string;
}

/**
 * Volta para a tela anterior, com um destino de reserva.
 *
 * `navigate(-1)` sozinho é armadilha: quem abriu a URL direto, ou chegou
 * por um link de fora, seria mandado para fora do produto. O React Router
 * marca `location.key` como "default" quando não há entrada anterior no
 * histórico dele — é assim que dá para saber se há para onde voltar.
 */
export function Voltar({ destino, rotuloDoDestino }: VoltarProps) {
  const navegar = useNavigate();
  const local = useLocation();
  const temAnterior = local.key !== "default";

  return (
    <button
      type="button"
      className={estilos.voltar}
      onClick={() => (temAnterior ? navegar(-1) : navegar(destino))}
    >
      <Icone nome="chevron_left" tamanho={20} />
      {temAnterior ? "Voltar" : `Voltar para ${rotuloDoDestino}`}
    </button>
  );
}
