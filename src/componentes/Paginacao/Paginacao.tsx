import { Icone } from "../Icone/Icone";
import estilos from "./Paginacao.module.css";

export interface PaginacaoProps {
  pagina: number;
  totalDePaginas: number;
  aoMudar: (pagina: number) => void;
}

/**
 * Monta a sequência visível: sempre a primeira e a última, as vizinhas da
 * atual, e reticências no lugar do que foi omitido. Sem isso, 40 páginas
 * viram 40 botões.
 */
function sequencia(pagina: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set([1, total, pagina, pagina - 1, pagina + 1]);
  const visiveis = [...paginas]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const saida: (number | "...")[] = [];
  visiveis.forEach((p, i) => {
    if (i > 0 && p - visiveis[i - 1] > 1) saida.push("...");
    saida.push(p);
  });
  return saida;
}

export function Paginacao({ pagina, totalDePaginas, aoMudar }: PaginacaoProps) {
  if (totalDePaginas <= 1) return null;

  return (
    <nav className={estilos.paginacao} aria-label="Paginação dos comentários">
      <button
        type="button"
        className={estilos.seta}
        onClick={() => aoMudar(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        <Icone nome="chevron_left" tamanho={20} />
      </button>

      <ul className={estilos.numeros}>
        {sequencia(pagina, totalDePaginas).map((item, i) =>
          item === "..." ? (
            <li key={`reticencias-${i}`} className={estilos.reticencias} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={`${estilos.numero} ${item === pagina ? estilos.atual : ""}`}
                onClick={() => aoMudar(item)}
                // `aria-current` é o que faz o leitor de tela anunciar
                // "página atual"; a cor sozinha não diz nada a quem não vê.
                aria-current={item === pagina ? "page" : undefined}
                aria-label={`Página ${item}`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className={estilos.seta}
        onClick={() => aoMudar(pagina + 1)}
        disabled={pagina === totalDePaginas}
        aria-label="Próxima página"
      >
        <Icone nome="chevron_right" tamanho={20} />
      </button>
    </nav>
  );
}
