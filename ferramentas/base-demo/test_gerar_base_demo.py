"""Testes do gerador da base de demonstração.

Nenhum comentário real entra aqui: as linhas são inventadas e têm a
mesma forma das do corpus. É o que permite versionar estes testes.

    pytest -q
"""

from datetime import date

import pytest

from gerar_base_demo import (
    achar_coluna,
    categoria_de,
    tem_caractere_comum,
    eh_numero_do_proprio,
    localidade_de,
    montar,
    numero_sozinho,
)

PARTIDO = {"sigla": "XX", "numero_partido": "13", "numero_candidato": "13123"}


class TestNumeroSozinho:
    """A regra decidida em 26/10: comentário que é só o número conta como
    posicionamento, não como engajamento afetivo."""

    @pytest.mark.parametrize(
        "texto",
        ["13", "13123", " 13 ", "13!", "1-3-1-2-3", "13.123", "13❤️"],
    )
    def test_reconhece_o_numero(self, texto):
        assert numero_sozinho(texto) is not None

    def test_digito_em_tecla_nao_e_numero_de_partido(self):
        """RF-020: dígito em formato de emoji conta como emoji.

        "1️⃣3️⃣" é como muita gente escreve o número, mas o requisito é
        explícito, e o pipeline já trata esses comentários como
        `engajamento_afetivo`. Trazê-los para o denominador inflava a
        proporção com 83 comentários do corpus.
        """
        assert numero_sozinho("1️⃣3️⃣") is None
        assert numero_sozinho("7️⃣0️⃣ 💙") is None
        assert not eh_numero_do_proprio("1️⃣3️⃣", PARTIDO)

    def test_tecla_junto_de_digito_comum_ainda_conta(self):
        # Tem dígito comum, então pelo RF-020 não é só-emoji e segue para
        # classificação; aí a regra do número vale.
        assert numero_sozinho("13 💙") == "13"

    @pytest.mark.parametrize(
        "texto",
        [
            "vota 13",  # tem palavra: diz outra coisa além do número
            "13 é o melhor",
            "",
            "1",  # um dígito só não é número de partido
            "1234567",  # longo demais para ser número de urna
            "❤️",  # só emoji: isso é engajamento afetivo mesmo
        ],
    )
    def test_nao_confunde_com_outra_coisa(self, texto):
        assert numero_sozinho(texto) is None

    def test_numero_do_proprio_partido_conta(self):
        assert eh_numero_do_proprio("13", PARTIDO)
        assert eh_numero_do_proprio("13123", PARTIDO)
        assert eh_numero_do_proprio("13333", PARTIDO)  # começa com 13

    def test_numero_de_outro_partido_nao_conta(self):
        # A decisão não cobre este caso. Chutar o sentido dele seria
        # inventar classificação, então ele fica como o modelo deixou.
        assert not eh_numero_do_proprio("22", PARTIDO)
        assert not eh_numero_do_proprio("45", PARTIDO)


class TestCategoria:
    @pytest.mark.parametrize(
        "tema,esperada",
        [
            ("asfalto em avenida", "Infraestrutura e saneamento"),
            ("cisternas", "Infraestrutura e saneamento"),
            ("vaga_de_emprego", "Trabalho e renda"),
            ("saúde rural", "Saúde"),
            ("acessibilidade em libras", "Saúde"),
            ("universitários", "Educação e juventude"),
            ("casa própria", "Habitação"),
            ("apoio esportivo", "Esporte e cultura"),
            ("inscrição", "Programas e inscrições"),
            ("visita na apae", "Saúde"),
        ],
    )
    def test_agrupa_tema_livre(self, tema, esperada):
        assert categoria_de(tema) == esperada

    def test_o_que_nao_casa_vai_para_outros(self):
        # Forçar numa gaveta qualquer daria um painel que parece
        # completo e não é.
        assert categoria_de("abobrinha espacial") == "Outros"
        assert categoria_de(None) == "Outros"


class TestLocalidade:
    def test_usa_o_lugar_que_o_tema_nomeia(self):
        assert localidade_de("asfalto no Memorare") == "Memorare"
        assert localidade_de("infraestrutura em Conjunto Redonda") == "Conjunto Redonda"

    def test_nao_inventa_quando_nao_ha(self):
        # O pipeline não extrai localidade. Dizer "não identificada" é
        # informação; adivinhar é erro com cara de dado.
        assert localidade_de("inscrição") == "Não identificada"
        assert localidade_de(None) == "Não identificada"


def linha(**campos):
    base = {
        "conta_id_hash": "hash_a",
        "post_id": "p1",
        "post_caption": "legenda",
        "permalink": "https://exemplo.invalid/p/1",
        "comment_id": "c1",
        "comment_text_raw": "texto inventado",
        "comment_timestamp": "2026-08-15T10:00:00",
        "data": "2026-08-15",
        "classificavel": "True",
        "stance": "a_favor",
        "tema": "",
        "urgente": "False",
    }
    return {**base, **campos}


CFG = {
    "_guia_version": "v1.1",
    "contas": {"hash_a": {"alvo": "Limma", "partido": PARTIDO}},
}


class TestMontar:
    def test_engajamento_afetivo_fica_fora_do_denominador(self):
        linhas = [
            linha(comment_id=f"c{i}", classificavel="True", stance="a_favor")
            for i in range(3)
        ] + [
            linha(comment_id=f"e{i}", classificavel="False", stance="a_favor")
            for i in range(7)
        ]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        c = b["porConta"]["hash_a"]

        # Contar as 7 junto faria toda proporção cair pela metade.
        assert sum(x["quantidade"] for x in c["classificados"]) == 3
        assert c["engajamentoAfetivo"]["quantidade"] == 7
        assert len(c["comentarios"]) == 3

    def test_numero_do_partido_entra_no_denominador(self):
        linhas = [
            linha(comment_id="num", comment_text_raw="13", classificavel="False"),
            linha(comment_id="outro", comment_text_raw="texto", classificavel="True"),
        ]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        c = b["porConta"]["hash_a"]

        assert sum(x["quantidade"] for x in c["classificados"]) == 2
        assert c["engajamentoAfetivo"]["quantidade"] == 0
        assert b["origem"]["regraDoNumeroDoPartido"]["comentariosAfetados"] == {
            "Limma": 1
        }

    def test_numero_do_partido_vira_a_favor_mesmo_se_estava_neutro(self):
        # É o que uniformiza: hoje o mesmo comentário cai em três baldes.
        linhas = [linha(comment_text_raw="13123", stance="neutro")]
        c = montar(linhas, CFG, date(2026, 11, 12), None)["porConta"]["hash_a"]
        assert c["comentarios"][0]["classe"] == "a_favor"

    def test_so_pedido_carrega_categoria(self):
        # O painel de demandas agrupa por categoria e só olha `pedido`;
        # categoria nas outras classes seria dado que ninguém lê.
        linhas = [
            linha(comment_id="p", stance="pedido", tema="asfalto em rua"),
            linha(comment_id="a", stance="a_favor", tema="asfalto em rua"),
        ]
        c = montar(linhas, CFG, date(2026, 11, 12), None)["porConta"]["hash_a"]
        por_id = {x["id"]: x for x in c["comentarios"]}

        assert por_id["p"]["categoria"] == "Infraestrutura e saneamento"
        assert por_id["a"]["categoria"] is None

    def test_desloca_as_datas_para_a_janela_da_demonstracao(self):
        linhas = [linha(data="2026-08-15", comment_timestamp="2026-08-15T10:00:00")]
        b = montar(linhas, CFG, date(2026, 11, 12), None)

        assert b["porConta"]["hash_a"]["comentarios"][0]["publicadoEm"].startswith(
            "2026-11-12"
        )
        assert b["origem"]["diaDoCorpusComoHoje"] == "2026-08-15"

    def test_o_dia_do_corpus_escolhido_manda_no_deslocamento(self):
        linhas = [
            linha(comment_id="a", data="2026-08-15", comment_timestamp="2026-08-15T10:00:00"),
            linha(comment_id="b", data="2026-09-17", comment_timestamp="2026-09-17T10:00:00"),
        ]
        b = montar(linhas, CFG, date(2026, 11, 12), date(2026, 8, 15))
        datas = {x["id"]: x["publicadoEm"][:10] for x in b["porConta"]["hash_a"]["comentarios"]}

        assert datas["a"] == "2026-11-12"
        # O que vinha depois continua depois — e fica fora da janela, que
        # é exatamente o efeito pretendido da escolha da âncora.
        assert datas["b"] > "2026-11-12"

    def test_nenhum_identificador_de_autor_sai_na_base(self):
        # O tipo `Comentario` não tem autor, e isto garante que nenhuma
        # coluna do corpus vaze para dentro dele por descuido.
        linhas = [linha(comment_author_hash="abc123", conta_id_hash="hash_a")]
        c = montar(linhas, CFG, date(2026, 11, 12), None)["porConta"]["hash_a"]
        assert "autor" not in c["comentarios"][0]
        assert "abc123" not in str(c["comentarios"][0])

    def test_proporcao_nunca_e_nan(self):
        # NaN não é JSON válido e quebraria o navegador; sem denominador
        # a proporção vem como null e a tela escreve um traço.
        c = montar([], CFG, date(2026, 11, 12), None)["porConta"]["hash_a"]
        assert all(x["proporcao"] is None for x in c["classificados"])


class TestColunasDoPipeline:
    """O prompt v5.1 passou a extrair `categoria` e `localidade`. Quando
    elas estão no CSV, é delas que a base lê — coluna do pipeline ganha
    de heurística, sempre."""

    def test_le_a_coluna_quando_ela_existe(self):
        linhas = [
            linha(
                stance="pedido",
                tema="asfalto em rua",  # a reserva diria "Infraestrutura e saneamento"
                categoria="mobilidade urbana",
                localidade="Teresina",
            )
        ]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        pedido = b["porConta"]["hash_a"]["comentarios"][0]

        assert pedido["categoria"] == "mobilidade urbana"
        assert pedido["localidade"] == "Teresina"
        assert b["origem"]["categoria"] == "coluna:categoria"
        assert b["origem"]["localidade"] == "coluna:localidade"

    def test_cai_na_reserva_quando_a_coluna_nao_existe(self):
        linhas = [linha(stance="pedido", tema="asfalto em rua")]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        pedido = b["porConta"]["hash_a"]["comentarios"][0]

        assert pedido["categoria"] == "Infraestrutura e saneamento"
        # A base diz de onde veio: número derivado e número extraído não
        # valem a mesma coisa, e quem olha precisa poder saber qual é.
        assert b["origem"]["categoria"] == "derivada do tema"

    def test_coluna_vazia_de_ponta_a_ponta_nao_conta_como_existente(self):
        # Acontece depois de uma rodada que falhou. Ler dela daria um
        # painel vazio sem ninguém entender por quê.
        linhas = [linha(stance="pedido", tema="cisterna", categoria="")]
        b = montar(linhas, CFG, date(2026, 11, 12), None)

        assert b["origem"]["categoria"] == "derivada do tema"
        assert b["porConta"]["hash_a"]["comentarios"][0]["categoria"] == (
            "Infraestrutura e saneamento"
        )

    def test_celula_vazia_numa_coluna_que_existe_vira_outro(self):
        linhas = [
            linha(comment_id="a", stance="pedido", categoria="saúde"),
            linha(comment_id="b", stance="pedido", categoria="", tema="cisterna"),
        ]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        por_id = {c["id"]: c for c in b["porConta"]["hash_a"]["comentarios"]}

        assert por_id["a"]["categoria"] == "saúde"
        # Misturar extraído com derivado na mesma base seria pior que um
        # balde "outro" honesto.
        assert por_id["b"]["categoria"] == "outro"

    def test_aceita_nome_alternativo_de_coluna(self):
        linhas = [linha(stance="pedido", categoria_demanda="saúde")]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        assert b["origem"]["categoria"] == "coluna:categoria_demanda"

    def test_so_pedido_carrega_as_duas_mesmo_vindo_de_coluna(self):
        linhas = [
            linha(comment_id="p", stance="pedido", categoria="saúde", localidade="Teresina"),
            linha(comment_id="a", stance="a_favor", categoria="saúde", localidade="Teresina"),
        ]
        b = montar(linhas, CFG, date(2026, 11, 12), None)
        por_id = {c["id"]: c for c in b["porConta"]["hash_a"]["comentarios"]}

        assert por_id["p"]["categoria"] == "saúde"
        assert por_id["a"]["categoria"] is None
        assert por_id["a"]["localidade"] is None


class TestAcharColuna:
    def test_devolve_none_sem_linhas(self):
        assert achar_coluna([], ("categoria",)) is None

    def test_respeita_a_ordem_de_preferencia(self):
        linhas = [{"categoria": "a", "categoria_demanda": "b"}]
        assert achar_coluna(linhas, ("categoria", "categoria_demanda")) == "categoria"

    def test_pula_a_preferida_quando_ela_esta_vazia(self):
        linhas = [{"categoria": "   ", "categoria_demanda": "b"}]
        assert achar_coluna(linhas, ("categoria", "categoria_demanda")) == "categoria_demanda"


class TestRF020:
    """Os casos de verificação escritos no próprio RF-020, da v0.6."""

    @pytest.mark.parametrize("texto", ["👏👏👏", "7️⃣0️⃣ 💙", "!!!", "..."])
    def test_so_emoji_ou_pontuacao(self, texto):
        assert not tem_caractere_comum(texto)

    @pytest.mark.parametrize("texto", ["13", "👏👏 lindo", "Dk"])
    def test_tem_letra_ou_digito_comum(self, texto):
        # "qualquer que seja o seu comprimento" — o RF-060 revogou o
        # descarte por tamanho.
        assert tem_caractere_comum(texto)
