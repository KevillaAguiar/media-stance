# Plano de testes — índice

Este arquivo é o índice das três suítes do projeto. O **plano e relatório
completo** — método, casos, defeitos encontrados, decisões pendentes e
impacto no projeto — é um documento vivo, mantido fora do repositório e
anexado à documentação técnica (E2).

| Suíte | Onde | Como rodar | Testes |
| --- | --- | --- | --- |
| Pipeline (normalização, triagem, deduplicação) | repositório de rotulagem | `PIPELINE_DIR=... python3 -m pytest` | 66 |
| Front-end | este repositório | `npm test` | 109 |
| Regressão dos casos difíceis (S4.4) | `ferramentas/regressao/` | `cd ferramentas/regressao && python3 -m pytest` | 38 |

Nenhuma das três toca a rede, usa chave de API ou precisa de servidor.

## O critério

As três suítes seguem o mesmo critério de o que merece teste: **o que
pode quebrar sem ninguém perceber.** Isso exclui muita coisa de
propósito. Um botão que some da tela qualquer pessoa vê na primeira vez
que abre. Uma proporção calculada errado continua sendo um número bem
formatado na tela, e ninguém percebe até alguém conferir na mão.

E os testes afirmam o que o requisito manda, não o que o código faz
hoje. Onde os dois discordam, o teste fica marcado como defeito
conhecido, com o motivo escrito ao lado — a suíte fica verde, mas o
defeito fica registrado onde se trabalha.

## Regressão dos casos difíceis

Tem LEIA-ME próprio: `ferramentas/regressao/LEIA-ME.md`. Em resumo: a
S4.1 levantou 31 erros do classificador; 19 viraram teste que exige o
rótulo do gabarito, 12 ficam monitorados porque nem o grupo concorda com
o gabarito deles. A suíte não chama o classificador — compara com a
última rodada registrada em `respostas_do_modelo.csv`.

## Base de demonstração

Também tem LEIA-ME próprio: `src/api/LEIA-ME-base-demo.md`, e o gerador
está em `ferramentas/base-demo/` com 54 testes.

## Privacidade

Nenhum arquivo versionado em qualquer das três suítes contém texto de
comentário real. Opinião política é dado pessoal sensível pelo art. 5º,
II da LGPD, e este repositório é público. Os casos de teste do pipeline
são reescritos preservando só a propriedade estrutural que o teste
verifica; os da regressão guardam apenas id, rótulo e modo de falha, com
o texto fora do repositório.
