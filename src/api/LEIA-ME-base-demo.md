# Base de demonstração (S4.4)

Faz as quatro telas internas mostrarem **o resultado real da nossa
rodada de classificação**, sem servidor nenhum. É o caminho da
apresentação de 12/11.

```bash
# 1. gerar a base — FORA da pasta do projeto
python3 gerar_base_demo.py \
  --corpus classificados_stance_v5_1.csv \
  --config config_politico.json \
  --saida  ~/media-stance-dados/base-demo.json \
  --ancorar-em 2026-11-12 \
  --dia-do-corpus 2026-08-15

# 2. subir o sistema apontando para ela
BASE_DEMO=~/media-stance-dados/base-demo.json npm run demo
```

No Windows, o PowerShell usa outra sintaxe:

```powershell
$env:BASE_DEMO="C:\Users\kevil\media-stance-dados\base-demo.json"; npm run demo
```

`npm run dev` continua como sempre, com os dados inventados. A fonte é
escolhida por `VITE_FONTE`, que o `npm run demo` já define.

---

## O arquivo não entra no repositório — e nem na pasta dele

Ele carrega comentário real de pessoa identificável. Opinião política é
**dado pessoal sensível pelo art. 5º, II da LGPD**, e este repositório é
público.

Por isso ele mora **fora** da pasta do projeto, e o servidor de
desenvolvimento o entrega a partir do caminho em `BASE_DEMO`. Deixá-lo em
`public/` e confiar no `.gitignore` seria um `git add -f` — ou um zip da
pasta, ou um editor que salva onde não devia — de distância de publicar
os dados. O `.gitignore` cobre o caminho mesmo assim, mas como segunda
barreira, não como a primeira.

O gerador entra no repositório. O que ele produz, não. É a mesma regra do
relatório por e-mail.

---

## Três decisões que o gerador toma, e por quê

### O número do partido conta como posicionamento

Decisão do grupo em 26/10. Comentário que é **só** o número do partido ou
do candidato daquela conta (`13`, `13123`, `1️⃣3️⃣`, `13.333!`) passa a
contar como `a_favor` e entra no denominador.

Isso corrige uma inconsistência real: hoje o mesmo tipo de comentário cai
em três baldes diferentes — uns entram como `a_favor`, outros como
`neutro`, e 75 ficam fora do denominador como engajamento afetivo.

| | antes | depois |
|---|---|---|
| denominador | 4.890 | 4.965 |
| a favor | 77,5% | **78,7%** |
| contra | 4,9% | 4,9% |
| pedido | 1,3% | 1,3% |
| neutro | 16,3% | **15,1%** |

Número de **outro** partido não entra. A decisão não cobre esse caso, e
chutar o sentido dele seria inventar classificação.

### As datas são deslocadas, e isso é dito

O corpus vai até setembro; o Resumo do Dia abre em "hoje". Sem deslocar,
a demonstração ao vivo abriria numa tela vazia.

Todas as datas levam a **mesma** constante somada. Nada é inventado nem
duplicado. Qual dia do corpus vira "hoje" é escolha explícita
(`--dia-do-corpus`), e ela fica registrada na base, em
`origem.diaDoCorpusComoHoje`.

Com a âncora padrão, o painel de demandas — que é o que o produto tem de
mais próprio — abre praticamente vazio na apresentação. No corpus v1.1:

| âncora | pedidos na janela de 30 dias |
|---|---|
| último dia do corpus (17/09) | 2 |
| **15/08** | **38** |

**Não chute o dia: pergunte ao gerador.**

```bash
python3 gerar_base_demo.py --corpus classificados_stance_v5_1.csv \
  --config config_politico.json --saida /dev/null --sugerir-ancora
```

Ele lista os dias que rendem uma janela com conteúdo, e não gera nada.
Use o da primeira linha. **Isto precisa ser refeito no v5.1**: os 15/08
acima vieram de um corpus com 65 pedidos, e agora são 89 — o melhor dia
pode ser outro.

### Categoria e localidade vêm do pipeline — desde o v5.1

Essa era a única lacuna real entre o que o front-end espera e o que o
dado tinha. **O prompt v5.1 (27/10) fechou**: `categoria` sai de uma
lista fechada de 17 valores, normalizada no parser, com `outro` para o
que não cabe (5,4% do corpus); `localidade` é campo próprio, preenchido
só quando o comentário nomeia o lugar — legenda não conta —, com 288
comentários em 93 localidades canônicas.

O gerador lê as colunas. **Coluna do pipeline ganha de heurística,
sempre.**

A derivação por palavra-chave continua no arquivo como reserva, para
quem ainda tiver só o `classificados_stance_v1_1_FINAL.csv`. Quando ela
entra em ação, o gerador avisa em voz alta e grava em
`origem.categoria` / `origem.localidade` qual dos dois caminhos foi
usado — número derivado e número extraído não valem a mesma coisa, e
quem olha o painel precisa poder saber qual está vendo.

Se o pipeline batizar as colunas com outro nome, acrescente em
`NOMES_DE_CATEGORIA` / `NOMES_DE_LOCALIDADE` no topo do gerador. É mais
barato que renomear o CSV.

**Uma pergunta ainda aberta:** os 288 comentários com localidade são
5,9% dos classificáveis, mas o painel só mostra `pedido`. Quantos dos 89
pedidos trazem localidade decide se a coluna "Por localidade" tem o que
mostrar — vale conferir antes de 12/11.

---

## Para a apresentação

Vale dizer em voz alta o que está ao vivo e o que está pré-computado.
*"Estes são resultados reais da nossa última rodada, de setembro"* é
verdade e soa igualmente bem — e evita a pergunta constrangedora se
alguém reparar que o sistema não está coletando naquele instante.

O que a base **não** faz: não coleta, não classifica e não chama a Meta.
Login, perfil, cadastro de cliente e configuração política continuam nos
dados inventados nos dois modos — a base é resultado de classificação,
não cadastro de usuário.

---

## Testes

O gerador tem 46 testes (`pytest -q`, ao lado dele), todos sobre linhas
inventadas — nenhum comentário real entra num arquivo versionado. Eles
cobrem a regra do número, o agrupamento em categorias, o deslocamento de
datas e a garantia de que nenhum identificador de autor vaza para a base.

O lado do front-end tem 9 (`npm test`), incluindo o mínimo de comentários
para a taxa de atrito e a contagem de urgentes só do dia.
