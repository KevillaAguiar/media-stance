import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Fonte empacotada com o projeto, não buscada em CDN. Durante a demo ao
// vivo de 12/11 não dá para depender de rede de terceiro — e assim a tela
// também funciona offline. Os ícones são SVG embutido (ver Icone.tsx).
import "@fontsource-variable/inter/index.css";

import "./styles/global.css";

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
