import { beforeEach, describe, expect, it } from "vitest";
import {
  listarVersoesDaConfiguracao,
  obterConfiguracaoPolitica,
  salvarNovaVersaoDaConfiguracao,
} from "./index";
import { proximaVersao } from "./mock";

/* A configuração política é versionada e nunca sobrescrita. Não é
   capricho: cada resultado do classificador é carimbado com a versão que
   estava valendo. Sobrescrever faria um `politica_versao` de meses atrás
   apontar para um conteúdo diferente do que foi usado de fato — e aí
   nenhuma rodada antiga poderia ser reproduzida ou auditada.

   Por isso a API tem POST e não PUT nem PATCH, e por isso isto é teste. */
describe("Versionamento da configuração política", () => {
  beforeEach(async () => {
    await obterConfiguracaoPolitica();
  });

  it("cria uma versão nova em vez de alterar a que está valendo", async () => {
    const antes = await obterConfiguracaoPolitica();
    const depois = await salvarNovaVersaoDaConfiguracao({
      ...antes,
      adversarios: [...antes.adversarios, "Partido Novo"],
    });

    expect(depois.versao).not.toBe(antes.versao);
    expect(depois.adversarios).toContain("Partido Novo");
  });

  it("guarda a versão anterior no histórico, marcada como não vigente", async () => {
    const antes = await obterConfiguracaoPolitica();
    await salvarNovaVersaoDaConfiguracao({ ...antes, campo: "oposição" });

    const historico = await listarVersoesDaConfiguracao();
    const anterior = historico.find((v) => v.versao === antes.versao);

    expect(anterior).toBeDefined();
    expect(anterior?.vigente).toBe(false);
  });

  it("mantém exatamente uma versão vigente", async () => {
    const antes = await obterConfiguracaoPolitica();
    await salvarNovaVersaoDaConfiguracao({ ...antes, campo: "situação" });
    await salvarNovaVersaoDaConfiguracao({
      ...(await obterConfiguracaoPolitica()),
      campo: "oposição",
    });

    const vigentes = (await listarVersoesDaConfiguracao()).filter((v) => v.vigente);
    expect(vigentes).toHaveLength(1);
  });

  it("registra quem alterou e quando", async () => {
    const depois = await salvarNovaVersaoDaConfiguracao({
      ...(await obterConfiguracaoPolitica()),
      cargo: "Deputada Federal",
    });

    expect(depois.atualizadaPor).toMatch(/@/);
    expect(depois.atualizadaEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("não perde nenhuma versão pelo caminho", async () => {
    const quantas = (await listarVersoesDaConfiguracao()).length;

    for (const campo of ["a", "b", "c"]) {
      await salvarNovaVersaoDaConfiguracao({
        ...(await obterConfiguracaoPolitica()),
        campo,
      });
    }

    expect(await listarVersoesDaConfiguracao()).toHaveLength(quantas + 3);
  });

  it("numera v1.9 como v1.10, e não volta para v1.1", () => {
    // Comparação de versão como texto é um erro clássico, e o salto da
    // primeira casa para a segunda é exatamente onde ele aparece: como
    // texto, "v1.10" vem ANTES de "v1.9". Quem ordenar o histórico assim
    // mostra a versão errada como a mais recente.
    expect(proximaVersao("v1.0")).toBe("v1.1");
    expect(proximaVersao("v1.9")).toBe("v1.10");
    expect(proximaVersao("v1.10")).toBe("v1.11");
    expect(proximaVersao("v2.0")).toBe("v2.1");
  });

  it("não quebra com uma versão sem casa menor", () => {
    expect(proximaVersao("v3")).toBe("v3.1");
  });
});
