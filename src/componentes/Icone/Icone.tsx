import accountCircle from "@material-symbols/svg-400/outlined/account_circle.svg?raw";
import allInbox from "@material-symbols/svg-400/outlined/all_inbox.svg?raw";
import arrowDropDown from "@material-symbols/svg-400/outlined/arrow_drop_down.svg?raw";
import arrowRightAlt from "@material-symbols/svg-400/outlined/arrow_right_alt.svg?raw";
import assignment from "@material-symbols/svg-400/outlined/assignment.svg?raw";
import barChart from "@material-symbols/svg-400/outlined/bar_chart.svg?raw";
import brightness6 from "@material-symbols/svg-400/outlined/brightness_6.svg?raw";
import calendarMonth from "@material-symbols/svg-400/outlined/calendar_month.svg?raw";
import chevronLeft from "@material-symbols/svg-400/outlined/chevron_left.svg?raw";
import chevronRight from "@material-symbols/svg-400/outlined/chevron_right.svg?raw";
import close from "@material-symbols/svg-400/outlined/close.svg?raw";
import forum from "@material-symbols/svg-400/outlined/forum.svg?raw";
import lock from "@material-symbols/svg-400/outlined/lock.svg?raw";
import logout from "@material-symbols/svg-400/outlined/logout.svg?raw";
import mail from "@material-symbols/svg-400/outlined/mail.svg?raw";
import person from "@material-symbols/svg-400/outlined/person.svg?raw";

/* Ícones como SVG embutido, não como fonte.
   ---------------------------------------------------------------
   A fonte completa do Material Symbols tem 3,8 MB porque traz os ~7.600
   glifos. Importando só os SVGs que usamos, o custo é o traço de cada
   ícone — alguns bytes — e não há segunda requisição, nem flash de ícone
   faltando enquanto a fonte carrega.

   Para usar um ícone novo: adicione o import acima e a entrada no mapa.
   O compilador reclama se você usar um nome que não está aqui.
   --------------------------------------------------------------- */

const FONTES = {
  account_circle: accountCircle,
  all_inbox: allInbox,
  arrow_drop_down: arrowDropDown,
  arrow_right_alt: arrowRightAlt,
  assignment,
  bar_chart: barChart,
  brightness_6: brightness6,
  calendar_month: calendarMonth,
  chevron_left: chevronLeft,
  chevron_right: chevronRight,
  close,
  forum,
  lock,
  logout,
  mail,
  person,
} as const;

export type NomeDeIcone = keyof typeof FONTES;

/** Extrai os traços do arquivo. Todo Material Symbol é um ou mais <path>. */
function tracos(svg: string): string[] {
  return [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
}

const TRACOS: Record<NomeDeIcone, string[]> = Object.fromEntries(
  Object.entries(FONTES).map(([nome, svg]) => [nome, tracos(svg)]),
) as Record<NomeDeIcone, string[]>;

export interface IconeProps {
  nome: NomeDeIcone;
  /** 20 na navegação, 24 no corpo. */
  tamanho?: number;
  className?: string;
}

/**
 * Ícone decorativo.
 *
 * `aria-hidden` por padrão, porque todo ícone destas telas acompanha um
 * rótulo em texto. Se um dia um ícone ficar sozinho, quem leva o
 * `aria-label` é o botão que o contém, não este componente.
 */
export function Icone({ nome, tamanho = 20, className }: IconeProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      width={tamanho}
      height={tamanho}
      viewBox="0 -960 960 960"
      fill="currentColor"
      style={{ display: "block", flexShrink: 0 }}
    >
      {TRACOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
