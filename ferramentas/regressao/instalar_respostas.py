#!/usr/bin/env python3
"""Instala uma rodada nova do classificador em `respostas_do_modelo.csv`.

A suíte de regressão não chama o classificador: ela compara o gabarito
com o que está registrado neste arquivo. Quem mexeu no prompt ou no
pipeline roda a classificação sobre os 31 ids, salva um CSV com duas
colunas (`id,rotulo`) e passa esse arquivo aqui.

Esse desenho é de propósito. Assim a suíte roda de graça, sem chave de
API e sem rede, em qualquer máquina e em qualquer commit; e este
repositório, que é público, nunca precisa guardar chave nem texto de
comentário — só id e rótulo.

    python3 instalar_respostas.py rodada_nova.csv --conferir   # só mostra
    python3 instalar_respostas.py rodada_nova.csv              # grava

O relatório é a parte útil: ele diz quais casos passaram a acertar e
quais regrediram, antes de você gravar.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

# Esta ferramenta lê CSV que veio de outra pessoa, então é sensato rodar
# com `python3 -I`. O `-I` tira a pasta do script do `sys.path`, e aí o
# `import conftest` abaixo não acharia nada: estas duas linhas devolvem
# só esta pasta, e nada mais.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from conftest import CASOS, DEFEITOS_CONHECIDOS, ROTULOS_VALIDOS, ler_respostas

PASTA = Path(__file__).parent
DESTINO = PASTA / "respostas_do_modelo.csv"


def ler_rodada(caminho: Path) -> dict[str, str]:
    with open(caminho, encoding="utf-8-sig") as f:
        leitor = csv.DictReader(f)
        if leitor.fieldnames is None:
            sair(f"{caminho} está vazio.")
        colunas = [c.strip().lower() for c in leitor.fieldnames]
        if "id" not in colunas or "rotulo" not in colunas:
            sair(
                f"{caminho} precisa das colunas 'id' e 'rotulo'. "
                f"Encontrei: {leitor.fieldnames}"
            )
        pos_id, pos_rot = colunas.index("id"), colunas.index("rotulo")
        nomes = leitor.fieldnames
        return {
            str(l[nomes[pos_id]]).strip(): str(l[nomes[pos_rot]]).strip()
            for l in leitor
            if l.get(nomes[pos_id])
        }


def sair(mensagem: str) -> None:
    print(f"erro: {mensagem}", file=sys.stderr)
    raise SystemExit(2)


def conferir(rodada: dict[str, str]) -> None:
    """Recusa arquivo incompleto ou com rótulo fora do codebook.

    Instalar meia rodada seria pior que não instalar: a suíte passaria a
    comparar casos novos com respostas velhas sem ninguém perceber.
    """
    esperados = {c.id for c in CASOS}
    faltando = sorted(esperados - set(rodada))
    se_sobra = sorted(set(rodada) - esperados)
    invalidos = sorted(f"{i}={r!r}" for i, r in rodada.items() if r not in ROTULOS_VALIDOS)
    if faltando:
        sair(f"faltam {len(faltando)} dos 31 casos: {faltando}")
    if se_sobra:
        sair(f"ids que não pertencem ao conjunto da S4.1: {se_sobra}")
    if invalidos:
        sair(f"rótulo fora do codebook v5 ({sorted(ROTULOS_VALIDOS)}): {invalidos}")


def relatar(antes: dict[str, str], depois: dict[str, str]) -> None:
    por_id = {c.id: c for c in CASOS}
    corrigidos, regressoes, mudou_sem_acertar = [], [], []
    for cid, novo in sorted(depois.items()):
        caso, velho = por_id[cid], antes.get(cid)
        if novo == velho:
            continue
        if novo == caso.gabarito:
            corrigidos.append(caso)
        elif velho == caso.gabarito:
            regressoes.append((caso, novo))
        else:
            mudou_sem_acertar.append((caso, velho, novo))

    if not (corrigidos or regressoes or mudou_sem_acertar):
        print("Nenhuma resposta mudou em relação ao que já estava registrado.")
        return

    if corrigidos:
        print(f"\nPassaram a acertar ({len(corrigidos)}):")
        for caso in corrigidos:
            aviso = (
                "  <- tire de defeitos_conhecidos.csv"
                if caso.id in DEFEITOS_CONHECIDOS
                else ""
            )
            print(f"  + {caso.id}  -> {caso.gabarito}   {caso.modo}{aviso}")
    if regressoes:
        print(f"\nREGREDIRAM ({len(regressoes)}) — a suíte vai ficar vermelha:")
        for caso, novo in regressoes:
            print(f"  ! {caso.id}  {caso.gabarito} -> {novo}   {caso.modo}")
    if mudou_sem_acertar:
        print(f"\nMudaram sem acertar ({len(mudou_sem_acertar)}):")
        for caso, velho, novo in mudou_sem_acertar:
            print(f"  ~ {caso.id}  {velho} -> {novo}   (gabarito {caso.gabarito})")


def gravar(rodada: dict[str, str]) -> None:
    ordem = [c.id for c in CASOS]
    with open(DESTINO, "w", newline="\n", encoding="utf-8") as f:
        g = csv.writer(f, lineterminator="\n")
        g.writerow(["id", "rotulo"])
        g.writerows((cid, rodada[cid]) for cid in ordem)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("arquivo", type=Path, help="CSV da rodada nova, com colunas id,rotulo")
    p.add_argument("--conferir", action="store_true", help="só mostra o relatório, não grava")
    args = p.parse_args()

    if not args.arquivo.is_file():
        sair(f"não encontrei {args.arquivo}")

    rodada = ler_rodada(args.arquivo)
    conferir(rodada)
    relatar(ler_respostas(), rodada)

    if args.conferir:
        print("\n(--conferir: nada foi gravado)")
        return
    gravar(rodada)
    print(f"\nGravei {len(rodada)} respostas em {DESTINO.name}. Rode `python3 -m pytest` agora.")


if __name__ == "__main__":
    main()
