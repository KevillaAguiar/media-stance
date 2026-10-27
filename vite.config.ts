/// <reference types="vitest/config" />
import { readFileSync, statSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Entrega a base de demonstração a partir de um caminho FORA do projeto.
 *
 * Ela carrega comentário real de pessoa identificável — opinião política
 * é dado pessoal sensível pelo art. 5º, II da LGPD — e este repositório
 * é público. Colocar o arquivo em `public/` e confiar no `.gitignore`
 * seria um `git add -f` de distância de publicar os dados; mantê-lo fora
 * da pasta do projeto tira essa possibilidade do caminho.
 *
 * Use: BASE_DEMO=/caminho/para/base-demo.json npm run dev
 */
function baseDeDemonstracao(): Plugin {
  const caminho = process.env.BASE_DEMO;

  return {
    name: "media-stance:base-de-demonstracao",
    configureServer(servidor) {
      servidor.middlewares.use("/__base-demo.json", (_req, res) => {
        if (!caminho) {
          res.statusCode = 404;
          res.end("BASE_DEMO não definido");
          return;
        }
        try {
          statSync(caminho);
        } catch {
          res.statusCode = 404;
          res.end(`Arquivo não encontrado: ${caminho}`);
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        // Sem cache: regerar a base e recarregar a página precisa mostrar
        // a base nova, não a da geração anterior.
        res.setHeader("Cache-Control", "no-store");
        res.end(readFileSync(caminho));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), baseDeDemonstracao()],
  server: {
    // Abre no navegador padrão do sistema, e não no visualizador interno
    // do editor — que renderiza diferente e não tem as ferramentas de
    // desenvolvedor de verdade.
    open: true,
  },
  test: {
    // jsdom e não um navegador de verdade: estes testes perguntam o que a
    // interface diz e o que ela faz quando alguém clica, não como ela é
    // desenhada. Contraste e layout são medidos com o navegador, à parte.
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/testes/preparo.ts"],
    css: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/testes/**", "src/main.tsx"],
    },
  },
});
