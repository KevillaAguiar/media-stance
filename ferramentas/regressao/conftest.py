"""Apoio dos testes de regressão da S4.4.

Duas coisas moram aqui: a leitura dos arquivos versionados (casos e
respostas do modelo) e a leitura OPCIONAL do corpus, que é o único lugar
onde existe texto de comentário real.

O corpus não está neste repositório e nunca vai estar: o repositório é
público e opinião política é dado pessoal sensível pelo art. 5º, II da
LGPD. Os testes rodam inteiros sem ele — o texto só serve para a pessoa
entender a falha que apareceu na tela.
"""

from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from pathlib import Path

PASTA = Path(__file__).parent
ROTULOS_VALIDOS = {"a_favor", "contra", "neutro", "pedido"}

# Os 19 que o grupo considera defeito do modelo viram teste que exige o
# rótulo do gabarito. Os outros 12 são casos em que nem o grupo concorda
# com o gabarito, então exigir rótulo deles faria o teste falhar por
# ambiguidade da tarefa, e não por defeito do sistema: esses ficam
# apenas monitorados.
VEREDITO_QUE_EXIGE_ACERTO = "Erro do modelo"
VEREDITOS_MONITORADOS = ("Rótulo discutível", "Sem consenso")


@dataclass(frozen=True)
class Caso:
    id: str
    veredito: str
    modo: str
    gabarito: str
    previsto_na_s41: str

    @property
    def exige_acerto(self) -> bool:
        return self.veredito == VEREDITO_QUE_EXIGE_ACERTO


def ler_casos() -> list[Caso]:
    with open(PASTA / "casos.csv", encoding="utf-8") as f:
        return [Caso(**linha) for linha in csv.DictReader(f)]


def ler_defeitos_conhecidos() -> dict[str, str]:
    """Linha de base: os casos que hoje se sabe que o modelo erra.

    Este arquivo é a catraca da suíte, e por isso é uma lista escrita à
    mão em vez de algo deduzido da resposta atual do modelo. Caso que
    está aqui e continua errado sai como XFAIL, e a suíte segue verde.
    Caso que NÃO está aqui e erra reprova — é regressão. Caso que está
    aqui e passa a acertar sai como XPASS, que também reprova: é o aviso
    para tirar a linha daqui e passar a exigir o acerto para sempre.
    """
    with open(PASTA / "defeitos_conhecidos.csv", encoding="utf-8") as f:
        return {l["id"]: l["nota"] for l in csv.DictReader(f)}


def ler_respostas() -> dict[str, str]:
    """O que o classificador respondeu na última rodada registrada."""
    with open(PASTA / "respostas_do_modelo.csv", encoding="utf-8") as f:
        return {l["id"]: l["rotulo"].strip() for l in csv.DictReader(f)}


def ler_corpus() -> dict[str, str]:
    """Texto dos comentários, se a pessoa apontou o corpus.

    `CORPUS_REGRESSAO` aponta para a planilha dos 31 erros, que fica FORA
    desta pasta. Sem a variável, devolve vazio e os testes seguem — só as
    mensagens de falha ficam sem o texto.
    """
    caminho = os.environ.get("CORPUS_REGRESSAO")
    if not caminho or not Path(caminho).is_file():
        return {}
    try:
        import openpyxl
    except ImportError:
        return {}
    aba = openpyxl.load_workbook(caminho, read_only=True)["Erros_LLM"]
    linhas = list(aba.iter_rows(values_only=True))
    col = {str(c): i for i, c in enumerate(linhas[0])}
    if "id" not in col or "comentario" not in col:
        return {}
    return {
        str(l[col["id"]]).strip(): str(l[col["comentario"]] or "").strip()
        for l in linhas[1:]
        if l[0]
    }


CASOS = ler_casos()
RESPOSTAS = ler_respostas()
DEFEITOS_CONHECIDOS = ler_defeitos_conhecidos()
CORPUS = ler_corpus()


def descrever(caso: Caso) -> str:
    """Mensagem de falha. Só mostra texto se o corpus foi apontado."""
    partes = [
        f"{caso.id} [{caso.modo}]",
        f"gabarito={caso.gabarito}",
        f"modelo={RESPOSTAS.get(caso.id, '(sem resposta)')}",
    ]
    texto = CORPUS.get(caso.id)
    if texto:
        # Truncado de propósito: isto é comentário real de pessoa
        # identificável. Não cole esta saída em repositório, issue, chat
        # nem relatório.
        recorte = texto if len(texto) <= 80 else texto[:77] + "..."
        partes.append(f'texto="{recorte}"')
    return " | ".join(partes)


def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """Relatório dos 12 monitorados: registra, não reprova."""
    monitorados = [c for c in CASOS if not c.exige_acerto]
    if not monitorados:
        return
    acertos = sum(1 for c in monitorados if RESPOSTAS.get(c.id) == c.gabarito)
    linha = terminalreporter.write_line
    terminalreporter.write_sep("-", "casos monitorados (S4.1: sem consenso sobre o gabarito)")
    linha(f"{acertos} de {len(monitorados)} coincidem com o gabarito. Nenhum reprova a suíte.")
    for caso in monitorados:
        resposta = RESPOSTAS.get(caso.id, "(sem resposta)")
        marca = "=" if resposta == caso.gabarito else "~"
        linha(f"  {marca} {caso.id}  {caso.gabarito} -> {resposta}   {caso.modo}")
    if not CORPUS:
        linha("")
        linha("CORPUS_REGRESSAO não está apontado: as falhas saem sem o texto do comentário.")
