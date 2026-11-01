#!/usr/bin/env python3
"""
Gera a base de demonstração do Media Stance (S4.4).

Lê o corpus já classificado e escreve um JSON que o front-end carrega no
lugar dos dados inventados. A tela passa a mostrar resultado real da
nossa rodada, sem servidor nenhum.

    python3 gerar_base_demo.py \
        --corpus  classificados_stance_v5_1.csv \
        --config  config_politico.json \
        --saida   ~/media-stance-dados/base-demo.json \
        --ancorar-em 2026-11-12 --dia-do-corpus 2026-08-15

Use o CSV do v5.1: é o que traz `categoria` e `localidade` como colunas
extraídas. Com o v1.1 o gerador ainda funciona, mas deriva as duas do
campo `tema` por palavra-chave — e avisa em voz alta que fez isso.

O ARQUIVO GERADO NÃO ENTRA EM REPOSITÓRIO. Ele carrega comentário real de
pessoa identificável, que é dado pessoal sensível pelo art. 5º, II da
LGPD. O gerador entra; o que ele produz, não — é a mesma regra do
relatório por e-mail, e o `.gitignore` do front-end cobre o caminho.

Sem dependência além da biblioteca padrão, exceto `emoji`, que é opcional.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

csv.field_size_limit(10**7)

try:
    import emoji as _emoji

    tem_emoji = True
except ImportError:  # pragma: no cover - caminho de ambiente
    tem_emoji = False

# ---------------------------------------------------------------------
# Regra do número do partido
# ---------------------------------------------------------------------

TECLA = {f"{d}️⃣": str(d) for d in range(10)}
ENFEITE = re.compile(r"[\s.,!?\-_*#'\"‍️❤]")


def _sem_emoji(texto: str) -> str:
    """Remove emoji. Sem a biblioteca, remove por categoria Unicode.

    O caminho sem biblioteca é pior — não conhece sequências compostas —
    mas é melhor do que falhar: a base precisa poder ser gerada na
    máquina de qualquer pessoa do grupo.
    """
    if tem_emoji:
        return _emoji.replace_emoji(texto, "")
    return "".join(
        c for c in texto if unicodedata.category(c) not in {"So", "Sk", "Cf"}
    )


COMUM = re.compile(r"[0-9A-Za-z\u00c0-\u00ff]")


def tem_caractere_comum(texto: str) -> bool:
    """Sobra alguma letra ou dígito comum depois de tirar emoji e teclas?

    É o teste do RF-020: "um comentário que contenha ao menos uma letra ou
    um dígito comum não se enquadra" na condição de só-emoji, "qualquer
    que seja o seu comprimento. Dígitos em formato de emoji (por exemplo,
    '7️⃣0️⃣') contam como emoji."

    As teclas saem ANTES da checagem, e é esse o ponto: convertê-las em
    dígito primeiro apagaria a distinção que o requisito faz.
    """
    s = texto or ""
    for tecla in TECLA:
        s = s.replace(tecla, "")
    return bool(COMUM.search(_sem_emoji(s)))


def numero_sozinho(texto: str) -> str | None:
    """O número, quando o comentário inteiro é só um número.

    "13", "1-3", "13123 <coração>" e "13.333!" contam. Qualquer palavra
    junto descarta: aí o comentário diz outra coisa além do número.

    "1️⃣3️⃣" NÃO conta, mesmo sendo o número do partido: pelo RF-020,
    dígito em formato de emoji é emoji, e o comentário inteiro de emoji é
    `engajamento_afetivo`. No corpus são 83 comentários, e o pipeline já
    os trata assim — trazê-los para o denominador era defeito daqui.
    """
    if not tem_caractere_comum(texto):
        return None
    s = texto or ""
    for tecla, digito in TECLA.items():
        s = s.replace(tecla, digito)
    s = ENFEITE.sub("", _sem_emoji(s))
    return s if s.isdigit() and 2 <= len(s) <= 6 else None


def eh_numero_do_proprio(texto: str, partido: dict) -> bool:
    """O comentário é só o número do partido ou do candidato desta conta.

    Decisão do grupo (26/10): comentário que é só o número conta como
    posicionamento, e não como engajamento afetivo.

    Por que isso não é detalhe: hoje o mesmo comentário cai em três
    baldes diferentes — uns entram no denominador como `a_favor`, outros
    como `neutro`, e outros ficam fora dele. A regra uniformiza.

    Número de OUTRO partido não entra. A decisão não cobre esse caso, e
    chutar o sentido dele seria inventar classificação.

    Com o RF-020 respeitado, a regra NÃO muda o denominador: os textos
    com dígito comum já são classificáveis. O que ela corrige é o rótulo
    deles, que hoje oscila entre `a_favor` e `neutro`.
    """
    n = numero_sozinho(texto)
    if n is None:
        return False
    return n.startswith(partido["numero_partido"]) or n.startswith(
        partido["numero_candidato"]
    )


# ---------------------------------------------------------------------
# Categoria e localidade
#
# O prompt v5.1 (27/10) passou a extrair as duas como colunas próprias:
# `categoria` de uma lista fechada de 17 valores, e `localidade` só
# quando o comentário nomeia o lugar. Quando elas estão no CSV, é delas
# que a base lê — coluna do pipeline ganha de heurística minha, sempre.
#
# O que vem abaixo é a DERIVAÇÃO DE RESERVA, para o corpus v1.1, que só
# tinha `tema` em texto livre: 681 valores distintos em 10.112 linhas, 49
# deles entre os 65 pedidos. Um painel com 49 linhas de contagem 1 não
# serve para nada, então o agrupamento por palavra-chave existia para dar
# alguma coisa ao painel.
#
# Ela continua aqui por dois motivos: quem ainda tiver só o CSV antigo
# consegue gerar a base, e o gerador avisa em voz alta quando caiu neste
# caminho, em vez de produzir número derivado parecendo número extraído.
# ---------------------------------------------------------------------

CATEGORIAS: list[tuple[str, tuple[str, ...]]] = [
    ("Infraestrutura e saneamento",
     ("asfalt", "cisterna", "água", "agua", "barragem", "arboriza",
      "infraestrutura", "expansão", "trator", "poço", "esgoto", "ponte",
      "estrada", "ilumina")),
    ("Trabalho e renda",
     ("emprego", "vaga", "trabalhista", "artesã", "babaçu", "fomento",
      "financeira", "renda", "oportunidade_jovem", "curso")),
    ("Saúde",
     ("saúde", "saude", "procedimento", "apae", "libras", "acessibilidade",
      "médic", "hospital", "remédio", "abelha")),
    ("Educação e juventude",
     ("universitár", "escola", "educa", "estudante", "jovem", "bolsa")),
    ("Habitação", ("casa própria", "casa propria", "moradia", "habita")),
    ("Esporte e cultura",
     ("esport", "barras", "cultura", "projeto joão", "festa", "música")),
    ("Programas e inscrições",
     ("inscri", "participação no programa", "convoca", "cadastro",
      "seleção", "edital")),
    ("Agenda e presença",
     ("visita", "compromisso", "conselho", "apoio_comunidade",
      "apoio_publicacao", "adesivo", "contato", "participação", "apoio")),
    ("Informação e atendimento",
     ("informação", "informacao", "funcionamento", "localiza", "ajuda",
      "dúvida", "duvida")),
]


def categoria_de(tema: str | None) -> str:
    if not tema:
        return "Outros"
    t = tema.strip().lower()
    for nome, chaves in CATEGORIAS:
        if any(k in t for k in chaves):
            return nome
    return "Outros"


# Reserva da localidade, pelo mesmo motivo: usa o que o próprio `tema`
# nomeia quando nomeia, e diz "Não identificada" no resto. Uma contagem
# honesta de "não identificada" é informação; uma localidade adivinhada é
# erro com cara de dado.

LUGAR = re.compile(
    r"\b(?:em|no|na|do|da|de)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+"
    r"(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+)?)"
)
NAO_IDENTIFICADA = "Não identificada"


def localidade_de(tema: str | None) -> str:
    if not tema:
        return NAO_IDENTIFICADA
    achado = LUGAR.search(tema)
    return achado.group(1).strip() if achado else NAO_IDENTIFICADA


# ---------------------------------------------------------------------

POSICIONAMENTO = ("a_favor", "contra", "pedido", "neutro")

# Nomes aceitos para cada coluna, em ordem de preferência. Se o pipeline
# batizar diferente, acrescente aqui — é mais barato que renomear o CSV.
NOMES_DE_CATEGORIA = ("categoria", "categoria_demanda", "demanda_categoria")
NOMES_DE_LOCALIDADE = ("localidade", "local", "localidade_canonica")


def achar_coluna(linhas: list[dict], nomes: tuple[str, ...]) -> str | None:
    """A primeira coluna que existe E tem algum valor preenchido.

    Existir não basta: um CSV pode trazer a coluna vazia de ponta a ponta
    depois de uma rodada que falhou, e aí ler dela daria um painel vazio
    sem ninguém entender por quê. Melhor cair na reserva e avisar.
    """
    if not linhas:
        return None
    presentes = linhas[0].keys()
    for nome in nomes:
        if nome in presentes and any((l.get(nome) or "").strip() for l in linhas):
            return nome
    return None


def ler(caminho: Path) -> list[dict]:
    with caminho.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def iso(carimbo: str, deslocamento: timedelta) -> str | None:
    """Carimbo do corpus, deslocado para a janela da demonstração."""
    if not carimbo:
        return None
    bruto = carimbo.strip().replace("Z", "+00:00")
    try:
        quando = datetime.fromisoformat(bruto)
    except ValueError:
        try:
            quando = datetime.strptime(bruto[:19], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None
    return (quando + deslocamento).isoformat(timespec="seconds")


def montar(
    linhas: list[dict], cfg: dict, ancora: date, dia_do_corpus: date | None
) -> dict:
    # --- deslocamento das datas -------------------------------------
    # O corpus termina em setembro e o Resumo do Dia abre em "hoje": sem
    # deslocar, a demonstração ao vivo abriria numa tela vazia. O
    # deslocamento fica registrado aqui e aparece no rodapé da tela —
    # esconder seria apresentar dado de setembro como sendo de hoje.
    #
    # QUAL dia do corpus vira "hoje" também importa, e não é detalhe de
    # apresentação. Os pedidos do corpus se concentram até meados de
    # agosto: ancorando no último dia, a janela de 30 dias da
    # demonstração pega 2 pedidos, e o painel de demandas — que é o que
    # o produto tem de mais próprio — abre vazio. Ancorando em
    # 2026-08-15, pega 38.
    #
    # Nada é inventado nem duplicado: muda só a constante somada a todas
    # as datas, igual para todas as linhas. O que fica fora da janela
    # continua na base, apenas com data posterior a "hoje". A origem
    # registra qual dia foi escolhido, e é isso que torna a escolha
    # auditável em vez de silenciosa.
    col_categoria = achar_coluna(linhas, NOMES_DE_CATEGORIA)
    col_localidade = achar_coluna(linhas, NOMES_DE_LOCALIDADE)

    dias = sorted({l["data"] for l in linhas if l.get("data")})
    # Corpus vazio não é cenário de produção, mas é o que acontece quando
    # alguém filtra o CSV e sobra nada. Estourar aqui esconderia a causa
    # atrás de um IndexError sem explicação.
    referencia = dia_do_corpus or (
        date.fromisoformat(dias[-1]) if dias else ancora
    )
    deslocamento = timedelta(days=(ancora - referencia).days)

    por_conta: dict[str, dict] = {}
    aplicados: Counter[str] = Counter()

    for hash_conta, conta in cfg["contas"].items():
        minhas = [l for l in linhas if l["conta_id_hash"] == hash_conta]
        partido = conta["partido"]

        comentarios = []
        contagem: Counter[str] = Counter()
        afetivo = 0
        por_post: dict[str, dict] = defaultdict(
            lambda: {"total": 0, "contra": 0, "legenda": "", "permalink": ""}
        )

        for l in minhas:
            classificavel = l["classificavel"] == "True"
            classe = l["stance"]

            if eh_numero_do_proprio(l["comment_text_raw"], partido):
                if not (classificavel and classe == "a_favor"):
                    aplicados[conta["alvo"]] += 1
                classificavel, classe = True, "a_favor"

            entra = classificavel and classe in POSICIONAMENTO
            if entra:
                contagem[classe] += 1
            else:
                afetivo += 1

            post = por_post[l["post_id"]]
            post["total"] += 1
            post["legenda"] = post["legenda"] or (l["post_caption"] or "")[:120]
            post["permalink"] = post["permalink"] or l["permalink"]
            if entra and classe == "contra":
                post["contra"] += 1

            if not entra:
                continue  # engajamento afetivo não vai para a lista

            publicado = iso(l["comment_timestamp"], deslocamento)
            if publicado is None:
                continue

            tema = (l["tema"] or "").strip() or None
            comentarios.append(
                {
                    "id": l["comment_id"],
                    "texto": l["comment_text_raw"],
                    "classe": classe,
                    "urgente": l["urgente"] == "True",
                    "tema": tema,
                    # Só `pedido` carrega as duas: é por `categoria` que o
                    # painel de demandas agrupa, e as outras classes não
                    # entram nele.
                    "categoria": (
                        (l.get(col_categoria) or "").strip() or "outro"
                        if col_categoria
                        else categoria_de(tema)
                    )
                    if classe == "pedido"
                    else None,
                    "localidade": (
                        (l.get(col_localidade) or "").strip() or NAO_IDENTIFICADA
                        if col_localidade
                        else localidade_de(tema)
                    )
                    if classe == "pedido"
                    else None,
                    "publicadoEm": publicado,
                    "urlNaRede": l["permalink"] or "",
                }
            )

        comentarios.sort(key=lambda c: c["publicadoEm"], reverse=True)
        total = sum(contagem.values())
        sufixo = "o" if conta["alvo"] == "Limma" else "a"

        por_conta[hash_conta[:12]] = {
            "conta": {
                "nome": f"Deputad{sufixo} {conta['alvo']}",
                "usuario": f"@dep.{conta['alvo'].lower()}",
            },
            "partido": partido,
            "classificados": [
                {
                    "classe": c,
                    "quantidade": contagem[c],
                    "proporcao": (contagem[c] / total) if total else None,
                }
                for c in POSICIONAMENTO
            ],
            "engajamentoAfetivo": {
                "quantidade": afetivo,
                "proporcao": afetivo / len(minhas) if minhas else 0,
            },
            "comentarios": comentarios,
            "publicacoes": [
                {
                    "id": pid,
                    "legenda": p["legenda"],
                    "comentarios": p["total"],
                    "contra": p["contra"],
                    "permalink": p["permalink"],
                }
                for pid, p in por_post.items()
            ],
        }

    return {
        "_aviso": (
            "Base de demonstração. Contém comentário real de pessoa "
            "identificável — dado pessoal sensível pela LGPD art. 5º, II. "
            "NÃO versionar este arquivo."
        ),
        "geradoEm": datetime.now().isoformat(timespec="seconds"),
        "origem": {
            "corpus": "classificados_stance_v1_1_FINAL.csv",
            "modelo": "openrouter:meta-llama/llama-3.3-70b-instruct",
            "guia": cfg.get("_guia_version"),
            "comentarios": len(linhas),
            "periodoReal": {
                "de": dias[0] if dias else None,
                "ate": dias[-1] if dias else None,
            },
            "diaDoCorpusComoHoje": referencia.isoformat(),
            # De onde vieram categoria e localidade. Vai para a base e
            # pode ir para a tela: número extraído pelo pipeline e número
            # derivado por palavra-chave não valem a mesma coisa, e quem
            # olha o painel precisa poder saber qual dos dois está vendo.
            "categoria": "coluna:" + col_categoria if col_categoria else "derivada do tema",
            "localidade": "coluna:" + col_localidade if col_localidade else "derivada do tema",
            "deslocamentoEmDias": deslocamento.days,
            "regraDoNumeroDoPartido": {
                "decididaEm": "2026-10-26",
                "comentariosAfetados": dict(aplicados),
            },
        },
        "porConta": por_conta,
    }


def sugerir_ancora(linhas: list[dict], quantas: int = 8) -> list[tuple]:
    """Quais dias do corpus rendem uma janela de demonstração com conteúdo.

    O painel de demandas abre em 7 dias e só mostra `pedido`. Se o dia
    escolhido como "hoje" cair numa parte magra do corpus, ele abre
    vazio na frente da plateia. Esta conta diz onde está a parte cheia,
    em vez de alguém adivinhar.
    """
    por_dia: dict[date, Counter] = defaultdict(Counter)
    for l in linhas:
        if not l.get("data"):
            continue
        d = date.fromisoformat(l["data"])
        por_dia[d]["total"] += 1
        por_dia[d][l["stance"]] += 1

    dias = sorted(por_dia)
    saida = []
    for d in dias:
        def soma(campo: str, n: int) -> int:
            inicio = d - timedelta(days=n - 1)
            return sum(
                por_dia[x][campo] for x in dias if inicio <= x <= d
            )

        saida.append(
            (soma("pedido", 30), soma("pedido", 7), por_dia[d]["total"],
             soma("total", 7), soma("contra", 30), d)
        )

    saida.sort(reverse=True)
    return saida[:quantas]


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--corpus", type=Path, required=True)
    p.add_argument("--config", type=Path, required=True)
    p.add_argument("--saida", type=Path, required=True)
    p.add_argument(
        "--ancorar-em",
        default=date.today().isoformat(),
        help="O dia que a base deve chamar de hoje (padrão: hoje). "
        "Para a apresentação, use 2026-11-12.",
    )
    p.add_argument(
        "--dia-do-corpus",
        default=None,
        help="Qual dia do corpus vira esse 'hoje'. O padrão é o último "
        "dia do corpus, e aí o painel de demandas abre quase vazio: os "
        "pedidos se concentram até meados de agosto. Use 2026-08-15.",
    )
    p.add_argument(
        "--sugerir-ancora",
        action="store_true",
        help="Não gera nada: só lista os dias do corpus que rendem uma "
        "janela de demonstração com conteúdo, e sai.",
    )
    a = p.parse_args()

    if a.sugerir_ancora:
        linhas = ler(a.corpus)
        print("Melhores dias para usar em --dia-do-corpus:\n")
        print(f"{'ped30':>6}{'ped7':>6}{'hoje':>6}{'tot7':>7}{'ctr30':>7}  dia")
        for ped30, ped7, total, tot7, ctr30, d in sugerir_ancora(linhas):
            print(f"{ped30:6}{ped7:6}{total:6}{tot7:7}{ctr30:7}  {d}")
        print(
            "\nped30 = pedidos na janela de 30 dias (o painel de demandas);\n"
            "tot7  = comentários na janela de 7 dias (o resumo do dia).\n"
            "Escolha o dia da primeira linha, salvo motivo para outro."
        )
        return 0

    if not tem_emoji:
        print(
            "aviso: biblioteca `emoji` ausente; a regra do número do partido "
            "usa o caminho por categoria Unicode, que é menos preciso.\n"
            "       pip install emoji",
            file=sys.stderr,
        )

    base = montar(
        ler(a.corpus),
        json.loads(a.config.read_text(encoding="utf-8")),
        date.fromisoformat(a.ancorar_em),
        date.fromisoformat(a.dia_do_corpus) if a.dia_do_corpus else None,
    )

    a.saida.parent.mkdir(parents=True, exist_ok=True)
    a.saida.write_text(
        json.dumps(base, ensure_ascii=False, allow_nan=False, separators=(",", ":")),
        encoding="utf-8",
    )

    o = base["origem"]
    for campo in ("categoria", "localidade"):
        if o[campo] == "derivada do tema":
            print(
                f"aviso: {campo} NÃO veio do pipeline — foi derivada do campo "
                f"`tema` por palavra-chave.\n"
                f"       Use o classificados_stance_v5_1.csv, que traz a "
                f"coluna extraída.",
                file=sys.stderr,
            )

    print(f"{a.saida}  ({a.saida.stat().st_size / 1_000_000:.1f} MB)")
    print(f"  {o['comentarios']} comentários, {o['periodoReal']['de']} a {o['periodoReal']['ate']}")
    print(f"  {o['diaDoCorpusComoHoje']} do corpus vira {a.ancorar_em} "
          f"(deslocamento de {o['deslocamentoEmDias']} dias)")
    print(f"  número do partido mudou: {o['regraDoNumeroDoPartido']['comentariosAfetados']}")
    print(f"  categoria: {o['categoria']}   localidade: {o['localidade']}")
    for c in base["porConta"].values():
        t = sum(x["quantidade"] for x in c["classificados"])
        print(f"  {c['conta']['usuario']:16} {len(c['comentarios']):5} na lista, {t} no denominador")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
