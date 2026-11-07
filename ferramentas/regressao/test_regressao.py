"""Testes de regressão sobre os casos difíceis da S4.1 (tarefa S4.4).

A S4.1 levantou 31 erros do classificador e um revisor julgou cada um:
19 são defeito do modelo, 12 são casos em que o próprio grupo não
concorda com o gabarito.

Os 19 entram como teste que exige o rótulo do gabarito. Hoje todos
falham — são defeitos conhecidos, ainda não corrigidos —, então estão
marcados com `xfail(strict=True)`. Isso mantém a suíte verde e, no dia
em que alguém melhorar o prompt, o pytest avisa com XPASS: aí o marcador
sai e o caso passa a ser exigido para sempre. Se um caso já corrigido
regredir, a suíte fica vermelha.

Os 12 não exigem rótulo nenhum. Eles aparecem no relatório do final da
execução (ver `conftest.py`), para o grupo acompanhar sem que a
ambiguidade da tarefa reprove a suíte.

A suíte não chama o classificador e não gasta crédito de API. Ela compara
`respostas_do_modelo.csv` — o que o classificador respondeu na última
rodada — com o gabarito. Para atualizar esse arquivo depois de mexer no
prompt ou no pipeline, use `instalar_respostas.py`.
"""

from __future__ import annotations

import pytest

from conftest import (
    CASOS,
    DEFEITOS_CONHECIDOS,
    RESPOSTAS,
    ROTULOS_VALIDOS,
    VEREDITOS_MONITORADOS,
    descrever,
)

EXIGEM_ACERTO = [c for c in CASOS if c.exige_acerto]
MONITORADOS = [c for c in CASOS if not c.exige_acerto]


class TestConjuntoDeCasos:
    """O conjunto em si. Se ele se desfizer, os testes abaixo mentem."""

    def test_tem_os_31_erros_da_s41(self):
        assert len(CASOS) == 31

    def test_a_divisao_bate_com_a_tabela_do_artigo(self):
        # Seção "4.x Análise de erros": 19 falhas do modelo, 10 rótulos
        # discutíveis, 2 sem consenso.
        assert len(EXIGEM_ACERTO) == 19
        assert len(MONITORADOS) == 12
        sem_consenso = [c for c in CASOS if c.veredito == "Sem consenso"]
        assert len(sem_consenso) == 2

    def test_nao_ha_id_repetido(self):
        ids = [c.id for c in CASOS]
        assert len(set(ids)) == len(ids)

    def test_todo_caso_tem_resposta_registrada(self):
        faltando = sorted(c.id for c in CASOS if c.id not in RESPOSTAS)
        assert not faltando, f"sem resposta do modelo: {faltando}"

    def test_so_ha_rotulo_do_codebook(self):
        # O codebook v5 tem quatro classes. Rótulo fora dessa lista é
        # erro de geração do arquivo, não resultado do modelo.
        for caso in CASOS:
            assert caso.gabarito in ROTULOS_VALIDOS, caso.id
            assert RESPOSTAS[caso.id] in ROTULOS_VALIDOS, caso.id

    def test_veredito_monitorado_e_um_dos_dois_previstos(self):
        for caso in MONITORADOS:
            assert caso.veredito in VEREDITOS_MONITORADOS, caso.id

    def test_todo_caso_do_conjunto_era_erro_de_verdade(self):
        # Os 31 vieram de erro do modelo contra o gabarito. Um caso em
        # que gabarito e previsão coincidem não pertence a este conjunto
        # — teria entrado por engano na consolidação.
        iguais = [c.id for c in CASOS if c.gabarito == c.previsto_na_s41]
        assert not iguais, f"gabarito igual à previsão da S4.1: {iguais}"


@pytest.mark.parametrize(
    "caso",
    [
        pytest.param(
            c,
            id=f"{c.id}-{c.modo}",
            marks=pytest.mark.xfail(
                condition=c.id in DEFEITOS_CONHECIDOS,
                reason="defeito conhecido, listado em defeitos_conhecidos.csv",
                strict=True,
            ),
        )
        for c in EXIGEM_ACERTO
    ],
)
def test_erro_do_modelo_deve_virar_acerto(caso):
    """Os 19 que o grupo considera defeito do modelo.

    XPASS aqui é notícia boa: o modelo passou a acertar o caso. Tire a
    linha dele de `defeitos_conhecidos.csv` e ele passa a ser exigido
    para sempre — se regredir depois, a suíte fica vermelha.
    """
    assert RESPOSTAS[caso.id] == caso.gabarito, descrever(caso)


@pytest.mark.parametrize("caso", MONITORADOS, ids=lambda c: f"{c.id}-{c.modo}")
def test_caso_monitorado_continua_respondendo_algo_valido(caso):
    """Os 12 sem consenso sobre o gabarito.

    Não exige rótulo: exigir faria o teste falhar pela ambiguidade da
    tarefa, e não por defeito do sistema. O que se exige é que o
    classificador continue devolvendo uma das quatro classes — ou seja,
    que ele não tenha deixado de responder nem passado a inventar
    rótulo.
    """
    assert RESPOSTAS[caso.id] in ROTULOS_VALIDOS, descrever(caso)
