import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { Botao } from "../Botao/Botao";
import { Icone } from "../Icone/Icone";
import type { Periodo, RecorteDePeriodo } from "../../api";
import estilos from "./SeletorDePeriodo.module.css";
import "react-day-picker/style.css";

const RECORTES: { valor: RecorteDePeriodo; rotulo: string }[] = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7dias", rotulo: "Últimos 7 dias" },
  { valor: "30dias", rotulo: "Últimos 30 dias" },
  { valor: "personalizado", rotulo: "Personalizado" },
];

const diaEMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });
const diaCurto = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });

/** "AAAA-MM-DD" para Date local, sem passar por UTC. */
function paraData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function paraIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** "14 – 19 de janeiro" quando o mês é o mesmo; senão os dois por extenso. */
export function rotuloDoIntervalo({ de, ate }: Periodo): string {
  const inicio = paraData(de);
  const fim = paraData(ate);
  if (de === ate) return diaEMes.format(inicio);
  if (inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear()) {
    return `${diaCurto.format(inicio)} – ${diaEMes.format(fim)}`;
  }
  return `${diaEMes.format(inicio)} – ${diaEMes.format(fim)}`;
}

export interface SeletorDePeriodoProps {
  periodo: RecorteDePeriodo;
  intervalo: Periodo | null;
  aoEscolher: (periodo: RecorteDePeriodo, intervalo: Periodo | null) => void;
}

/**
 * Recorte de período, com calendário de intervalo em "Personalizado".
 *
 * O painel tem dois estados — lista de recortes e calendário — porque
 * escolher "Personalizado" não é escolher um período ainda: falta dizer
 * qual. Daí os botões Cancelar e Aplicar, que só aqui fazem sentido.
 */
export function SeletorDePeriodo({
  periodo,
  intervalo,
  aoEscolher,
}: SeletorDePeriodoProps) {
  const [aberto, setAberto] = useState(false);
  const [noCalendario, setNoCalendario] = useState(false);
  const [rascunho, setRascunho] = useState<DateRange | undefined>();
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);

  function fechar(devolverFoco = true) {
    setAberto(false);
    setNoCalendario(false);
    if (devolverFoco) gatilho.current?.focus();
  }

  useEffect(() => {
    if (!aberto) return;
    function aoClicar(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) {
        setAberto(false);
        setNoCalendario(false);
      }
    }
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  const rotulo =
    periodo === "personalizado" && intervalo
      ? rotuloDoIntervalo(intervalo)
      : (RECORTES.find((r) => r.valor === periodo)?.rotulo ?? "Hoje");

  function escolher(valor: RecorteDePeriodo) {
    if (valor === "personalizado") {
      setRascunho(
        intervalo
          ? { from: paraData(intervalo.de), to: paraData(intervalo.ate) }
          : undefined,
      );
      setNoCalendario(true);
      return;
    }
    aoEscolher(valor, null);
    fechar();
  }

  function aplicar() {
    if (!rascunho?.from) return;
    // Clicar um dia só é um intervalo de um dia, não um estado inválido.
    const fim = rascunho.to ?? rascunho.from;
    aoEscolher("personalizado", { de: paraIso(rascunho.from), ate: paraIso(fim) });
    fechar();
  }

  return (
    <div
      className={estilos.raiz}
      ref={raiz}
      onKeyDown={(evento) => {
        if (evento.key !== "Escape") return;
        evento.preventDefault();
        // Dentro do calendário, Escape volta para a lista em vez de fechar
        // tudo: desfaz um passo, não a interação inteira.
        if (noCalendario) setNoCalendario(false);
        else fechar();
      }}
    >
      <button
        type="button"
        ref={gatilho}
        className={`${estilos.gatilho} ${periodo === "personalizado" ? estilos.ativo : ""}`}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => (aberto ? fechar(false) : setAberto(true))}
      >
        <Icone nome="calendar_month" tamanho={20} className={estilos.icone} />
        <span>{rotulo}</span>
        <Icone nome="arrow_drop_down" tamanho={20} className={estilos.seta} />
      </button>

      {aberto && !noCalendario && (
        <ul className={estilos.lista} role="menu" aria-label="Período">
          {RECORTES.map(({ valor, rotulo }) => (
            <li key={valor}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={valor === periodo}
                className={estilos.opcao}
                onClick={() => escolher(valor)}
              >
                {rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && noCalendario && (
        <div className={estilos.painel} role="dialog" aria-label="Escolher período">
          <p className={estilos.resumo}>
            {rascunho?.from
              ? rotuloDoIntervalo({
                  de: paraIso(rascunho.from),
                  ate: paraIso(rascunho.to ?? rascunho.from),
                })
              : "Escolha a data inicial"}
          </p>

          <DayPicker
            mode="range"
            locale={ptBR}
            selected={rascunho}
            onSelect={setRascunho}
            // Não há comentário no futuro; oferecer datas que não podem
            // devolver nada só gera resultado vazio inexplicável.
            disabled={{ after: new Date() }}
            defaultMonth={rascunho?.from}
          />

          <div className={estilos.acoes}>
            <Botao variante="secundario" onClick={() => setNoCalendario(false)}>
              Cancelar
            </Botao>
            <Botao onClick={aplicar} disabled={!rascunho?.from}>
              Aplicar
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
