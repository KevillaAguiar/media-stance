# Media Stance · Front-end

Implementação das telas do produto Media Stance — o sistema que classifica
**posicionamento** (não sentimento) em comentários de contas parlamentares no
Instagram.

Este repositório é só o front-end. O protótipo completo, com todos os estados e
os três tamanhos de tela, está no Figma:

**[Protótipo — Media Stance](https://www.figma.com/design/ReE47cLRcVzjZuU5pDBrJW/)**

O Figma é a fonte da verdade. Divergência entre código e Figma se resolve
olhando o Figma, ou abrindo discussão com P4 antes de mudar.

---

## Telas a implementar

| Tela | O que mostra |
|---|---|
| **1 · Resumo do dia** | Cartões por classe de posicionamento (contagem + porcentagem), chips de resumo e recorte de período |
| **2 · Comentários que exigem resposta** | Lista filtrável por classe, com badge, trecho do comentário e ação "ver comentário" |
| **3 · Painel de demandas** | Pedidos de eleitor agrupados por tema, com volume e urgência |
| **Modal de comentário** | Comentário completo + botão "Responder comentário", que redireciona para o app da rede social |
| **Login · Cadastro · Esqueci senha · Modificar senha · Perfil** | Autenticação e conta |
| **Estados vazios** | Uma variação por tela, todas com o ícone `all_inbox` |

Cada uma existe em desktop, tablet e mobile. Capturas das três telas principais
estão em [`design/telas/`](design/telas/) — são referência rápida, não
substituem o Figma.

---

## Tokens

[`src/styles/tokens.css`](src/styles/tokens.css) é o espelho da coleção
`Media Stance · Tokens` do Figma: cores, tipografia, espaçamento, raio e
larguras de layout, com modo claro e escuro.

**Use as variáveis, nunca o valor literal.** Se você escrever `#2563EB` em vez
de `var(--acento-base)`, aquele elemento não acompanha a troca de tema e a
próxima mudança de paleta passa por ele sem avisar.

A troca de tema é o atributo `data-tema` na raiz:

```js
document.documentElement.dataset.tema = 'escuro'; // ou 'claro'
```

Sem o atributo, o CSS segue `prefers-color-scheme`.

---

## Classes de posicionamento

A interface renderiza cinco rótulos. Cada um tem um par de tokens
`--stance-<classe>-bg` / `--stance-<classe>-fg`:

| Classe | Significado |
|---|---|
| `a_favor` | Apoio ao parlamentar |
| `contra` | Oposição — inclusive elogio irônico |
| `pedido` | Demanda de eleitor, alimenta a tela 3 |
| `neutro` | Sem posicionamento identificável |
| `engajamento_afetivo` | Só emoji; fica **fora do denominador** das porcentagens |

A última linha é requisito, não detalhe: no piloto, 49% do corpus era só emoji.
Incluir isso na proporção distorce todos os números das telas 1 e 3.

`urgente` não é uma classe, é um marcador que pode acompanhar um `pedido` —
daí ter par de cor próprio.

---

## Acessibilidade

Não é opcional aqui, e já custou várias rodadas de correção no protótipo:

- **WCAG AA nos dois modos** — 4.5:1 para texto, 3:1 para elemento de
  interface. Par de cor novo se calcula, não se estima no olho.
- **Piso de 13px** para qualquer texto legível. `--tamanho-micro` (10px) e
  `--tamanho-caption` (12px) só para rótulo de eixo de gráfico e metadado não
  essencial.
- **Nada dentro da navegação usa token de superfície.** A sidebar, o rail e a
  tab bar são escuros nos dois modos; ícone ali usa os tokens `--nav-*`, que
  são constantes. Token de superfície inverte e quebra o contraste no escuro.
- Cor nunca é o único portador de significado — todo badge tem rótulo em texto.

---

## Stack

Ainda não definida — é decisão de P4 em S0. `src/styles/tokens.css` é CSS puro
de propósito: funciona com React, Vue, Svelte ou HTML direto, sem retrabalho
quando a escolha sair.

---

## Privacidade

Comentário de rede social carrega opinião política, que é dado pessoal
**sensível** pelo art. 5º, II da LGPD. No front-end isso significa:

- Nenhum nome de usuário ou identificador de autor aparece em tela ou em
  relatório — o back-end entrega o autor já pseudonimizado.
- Nenhum dado real de comentário vai para este repositório, nem como fixture,
  nem como mock, nem em captura de tela. Para desenvolver, use exemplo
  inventado.

---

Trabalho de Conclusão de Curso · Engenharia de Software · iCEV
