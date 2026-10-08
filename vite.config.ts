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
});
