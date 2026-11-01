# Gerador da base de demonstração

Lê o corpus já classificado e escreve o JSON que o front-end carrega no
lugar dos dados inventados.

**Por que um script Python mora num repositório TypeScript.** Ele
pertence a este projeto — é ferramenta do front-end, e quem mantém é P4.
O lugar natural seria o repositório de rotulagem, ao lado do corpus que
ele lê, mas lá só temos acesso de leitura. Como o script recebe os
caminhos por argumento, não precisa estar perto do CSV.

```bash
pip install emoji pytest
pytest -q                     # 46 testes, nenhum toca o corpus real
```

O passo a passo de uso, as decisões que ele toma e as restrições de
privacidade estão em [`src/api/LEIA-ME-base-demo.md`](../../src/api/LEIA-ME-base-demo.md).

**O arquivo que ele produz nunca entra em repositório.** Comentário real
de pessoa identificável é dado pessoal sensível pelo art. 5º, II da LGPD,
e este repositório é público. O gerador entra; o que ele produz, não.
