# Testes do front-end

```bash
npm test             # roda uma vez
npm run test:watch   # fica ouvindo enquanto você edita
npm run test:cobertura
```

Sem rede, sem servidor, sem banco. Vitest com jsdom.

## O que é testado, e por quê

Não é cobertura por cobertura. Cada arquivo cobre uma coisa que **pode
quebrar sem ninguém perceber** — onde a tela continua desenhando, só que
errado.

| Arquivo | O que protege |
|---|---|
| `Paginacao.test.tsx` | a sequência de páginas: reticências no lugar certo, nenhuma página repetida ou fora do intervalo |
| `CartaoEstatistica.test.tsx` | a proporção não pode contradizer a contagem ao lado dela |
| `ModalAdicionarConta.test.tsx` | a conta vem da Meta, nunca de digitação; conta bloqueada aparece dizendo por quê |
| `SeletorDeConta.test.tsx` | a troca de conta é chamada ao servidor, não estado local |
| `controle-de-acesso.test.tsx` | assessor não entra nas telas de administração, e falha de rede não abre a porta |
| `Voltar.test.tsx` | quem abriu a URL direto não é mandado para fora do produto |
| `versionamento.test.ts` | configuração política nunca é sobrescrita |

## Dois defeitos que estes testes acharam

**`0%` ao lado de uma contagem maior que zero.** `Intl` arredonda 0,4%
para `0%`, e a tela escrevia "2 · 0%" — contradição na mesma linha. O
mesmo valia para `100%` com alguma coisa ainda de fora. Agora são `<1%` e
`>99%`. Era o mesmo defeito que o relatório por e-mail já tinha e que foi
corrigido lá; aqui tinha passado.

**Nenhum.** O resto passou de primeira — o que também é informação: os
componentes novos foram construídos com estas regras em mente, e os
testes agora impedem que elas se percam numa refatoração.

## O que estes testes NÃO cobrem

- **Layout, contraste e responsividade.** Isso é medido com navegador de
  verdade, não com jsdom: um `getComputedStyle` em jsdom não sabe o que é
  um `grid`. A varredura de 360 a 1600px e o cálculo de contraste da WCAG
  rodam à parte.
- **A API real.** Tudo aqui roda sobre o mock. Quando o servidor existir,
  estes testes continuam valendo — eles verificam o que a interface faz
  com a resposta, não quem respondeu.
- **`src/sessao/`.** Não é autenticação, é um sinalizador de demonstração;
  testá-lo daria a impressão de que protege alguma coisa.
