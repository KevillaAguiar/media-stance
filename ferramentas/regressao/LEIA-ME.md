# Testes de regressão dos casos difíceis (S4.4)

A S4.1 levantou **31 erros** do classificador e um revisor julgou cada
um, com acesso ao comentário, à legenda, ao rótulo do gabarito e à
previsão. O resultado está na seção "4.x Análise de erros" do artigo:

| Veredito | Erros | O que vira teste |
| --- | --- | --- |
| Erro do modelo | 19 | teste que **exige** o rótulo do gabarito |
| Rótulo discutível | 10 | apenas **monitorado** |
| Sem consenso | 2 | apenas **monitorado** |

## Por que 12 deles não exigem rótulo

Nos 12 casos de "rótulo discutível" e "sem consenso", o próprio grupo não
concorda com o gabarito. Um teste que exigisse o rótulo do gabarito
nesses casos falharia pela ambiguidade da tarefa, e não por defeito do
sistema — ou seja, ficaria vermelho sem ninguém ter quebrado nada. Teste
que falha por motivo legítimo é teste que o time aprende a ignorar, e aí
ele deixa de servir para os outros 19 também.

Eles continuam rodando: a suíte exige só que o classificador devolva uma
das quatro classes do codebook (que ele não deixou de responder nem passou
a inventar rótulo), e o relatório do fim da execução mostra o que cada um
respondeu.

## Como rodar

```bash
cd ferramentas/regressao
python3 -m pytest
```

Hoje o esperado é `19 passed, 19 xfailed`. Não precisa de chave de API,
de rede, nem do corpus.

Para ver o texto do comentário nas mensagens de falha, aponte o corpus —
que fica **fora** deste repositório:

```bash
CORPUS_REGRESSAO=~/caminho/erros_llm_modos_de_falha_consolidado.xlsx python3 -m pytest
```

(precisa de `openpyxl`; sem ele a suíte roda igual, só sem o texto)

## Como atualizar depois de mexer no prompt

A suíte **não chama o classificador**. Ela compara o gabarito com o que
está em `respostas_do_modelo.csv`, que é o registro da última rodada.

Isso é de propósito: assim a suíte roda de graça e sem segredo nenhum, em
qualquer máquina e em qualquer commit, e este repositório — que é
público — nunca precisa guardar chave de API nem texto de comentário.

O ciclo é:

1. Quem mexeu no prompt roda a classificação sobre os 31 ids e salva um
   CSV com duas colunas: `id,rotulo`.
2. Confira antes de gravar:
   `python3 -I instalar_respostas.py rodada_nova.csv --conferir`
   O relatório diz quais casos passaram a acertar e quais regrediram.
3. Grave: `python3 -I instalar_respostas.py rodada_nova.csv`
4. `python3 -m pytest`

O passo 1 é a única coisa que depende de quem mantém o pipeline. O pedido
é só isto: *rode o classificador nestes 31 ids e me devolva um csv
`id,rotulo`.*

## A catraca

`defeitos_conhecidos.csv` é a linha de base: os casos que hoje se sabe
que o modelo erra. É uma lista escrita à mão, e não algo deduzido da
resposta atual, justamente para a suíte poder distinguir três coisas:

| Situação | O que a suíte faz |
| --- | --- |
| está na lista e continua errando | `XFAIL` — verde, defeito conhecido |
| **não** está na lista e erra | **vermelho** — é regressão |
| está na lista e passou a acertar | **vermelho** (`XPASS`) — tire a linha da lista |

O terceiro caso é de propósito: quando o modelo passa a acertar, alguém
tem que tirar a linha de `defeitos_conhecidos.csv`, e a partir daí aquele
caso é exigido para sempre. Se ele regredir depois, cai no segundo caso.

Foi a primeira versão disto que estava errada: a condição do `xfail` saía
da resposta atual do modelo, então um caso corrigido que voltasse a errar
era remarcado como "defeito conhecido" e a suíte continuava verde. A
catraca não cateava.

## Arquivos

| Arquivo | Versionado | O que é |
| --- | --- | --- |
| `casos.csv` | sim | os 31 casos: id, veredito, modo, gabarito, previsão da S4.1 |
| `defeitos_conhecidos.csv` | sim | a linha de base da catraca (19 ids) |
| `respostas_do_modelo.csv` | sim | a última rodada do classificador: `id,rotulo` |
| `conftest.py` | sim | leitura dos arquivos e relatório dos monitorados |
| `test_regressao.py` | sim | a suíte |
| `instalar_respostas.py` | sim | instala uma rodada nova, com relatório |
| o corpus | **não, nunca** | texto dos comentários, apontado por `CORPUS_REGRESSAO` |

## LGPD

Nenhum arquivo daqui tem texto de comentário. Só id, rótulo e modo de
falha.

Isto não é zelo decorativo: opinião política é dado pessoal sensível pelo
art. 5º, II da LGPD, e este repositório é **público**. Os comentários são
de pessoas identificáveis que não consentiram com nada. Em outubro dois
comentários reais acabaram dentro de `src/api/mock.ts` e tiveram que ser
trocados depois de já estarem publicados.

Daí as duas regras:

- O texto nunca entra em arquivo versionado. Ele vive no corpus, fora
  desta pasta, apontado por variável de ambiente.
- A saída do pytest **com** o corpus apontado tem trecho de comentário
  real (truncado em 80 caracteres). Não cole essa saída em commit, issue,
  print, relatório, chat de grupo nem slide. Rode sem o corpus quando a
  saída for sair da sua máquina.
