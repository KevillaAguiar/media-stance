/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
