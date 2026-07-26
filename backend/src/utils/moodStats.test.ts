import { describe, expect, it } from "vitest";
import { computeMoodStats } from "./moodStats";

function entry(energia?: string, generos: string[] = []) {
  return { emotion: { energia_atual: energia, generos_sugeridos: generos } };
}

describe("computeMoodStats", () => {
  it("retorna distribuição zerada e sem gêneros quando não há histórico", () => {
    expect(computeMoodStats([])).toEqual({
      energyDistribution: { baixa: 0, media: 0, alta: 0 },
      topGeneros: [],
    });
  });

  it("conta a distribuição de energia", () => {
    const history = [
      entry("alta"),
      entry("alta"),
      entry("baixa"),
      entry("media"),
    ];

    const result = computeMoodStats(history);

    expect(result.energyDistribution).toEqual({ baixa: 1, media: 1, alta: 2 });
  });

  it("ignora valores de energia desconhecidos", () => {
    const history = [entry("furiosa" as any), entry("alta")];

    const result = computeMoodStats(history);

    expect(result.energyDistribution).toEqual({ baixa: 0, media: 0, alta: 1 });
  });

  it("ranqueia os gêneros mais sugeridos, limitado a 5", () => {
    const history = [
      entry("alta", ["pop", "rock"]),
      entry("alta", ["pop"]),
      entry("baixa", ["jazz"]),
      entry("baixa", ["funk"]),
      entry("media", ["mpb"]),
      entry("media", ["samba"]),
    ];

    const result = computeMoodStats(history);

    expect(result.topGeneros[0]).toEqual({ genero: "pop", count: 2 });
    expect(result.topGeneros).toHaveLength(5);
  });
});
