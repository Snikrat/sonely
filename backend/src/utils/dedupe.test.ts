import { describe, expect, it } from "vitest";
import { dedupeConsecutiveTracks } from "./dedupe";

function t(name: string, artist = "Artist") {
  return { name, artist };
}

describe("dedupeConsecutiveTracks", () => {
  it("retorna lista vazia para entrada vazia", () => {
    expect(dedupeConsecutiveTracks([])).toEqual([]);
  });

  it("remove repetições consecutivas da mesma faixa", () => {
    const tracks = [t("A"), t("A"), t("B")];

    expect(dedupeConsecutiveTracks(tracks)).toEqual([t("A"), t("B")]);
  });

  it("mantém a faixa se ela repetir depois de outra faixa tocar no meio", () => {
    const tracks = [t("A"), t("B"), t("A")];

    expect(dedupeConsecutiveTracks(tracks)).toEqual([t("A"), t("B"), t("A")]);
  });

  it("considera nome e artista juntos, não só o nome", () => {
    const tracks = [t("A", "X"), t("A", "Y")];

    expect(dedupeConsecutiveTracks(tracks)).toEqual([t("A", "X"), t("A", "Y")]);
  });

  it("remove múltiplas repetições consecutivas em sequência", () => {
    const tracks = [t("A"), t("A"), t("A"), t("B"), t("B")];

    expect(dedupeConsecutiveTracks(tracks)).toEqual([t("A"), t("B")]);
  });
});
