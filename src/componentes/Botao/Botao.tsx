import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import estilos from "./Botao.module.css";

interface Comum {
  variante?: "primario" | "secundario";
  /** Ocupa toda a largura disponível. */
  largo?: boolean;
  className?: string;
  children: ReactNode;
}

type ComoBotao = Comum &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ComoLink = Comum &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type BotaoProps = ComoBotao | ComoLink;

/**
 * Botão com aparência única e semântica correta.
 *
 * Com `href` vira âncora: navegar para outro lugar é link, não botão —
 * quem usa leitor de tela ouve a diferença, e só o link oferece abrir em
 * nova aba pelo menu do navegador.
 */
export function Botao({
  variante = "primario",
  largo = false,
  className,
  children,
  ...resto
}: BotaoProps) {
  const classes = [estilos.botao, estilos[variante], largo && estilos.largo, className]
    .filter(Boolean)
    .join(" ");

  if ("href" in resto && resto.href !== undefined) {
    return (
      <a className={classes} {...(resto as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(resto as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
