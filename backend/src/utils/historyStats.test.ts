import { describe, expect, it } from "vitest";
import { computeHistoryStats } from "./historyStats";

function entry(date: string, objetivo?: string) {
  return { createdAt: new Date(date), emotion: { objetivo } };
}

describe("computeHistoryStats", () => {
  it("retorna zerado quando não há histórico", () => {
    expect(computeHistoryStats([])).toEqual({
      totalCount: 0,
      currentStreak: 0,
      topObjetivo: null,
    });
  });

  it("conta o total de entradas", () => {
    const history = [entry("2026-01-01"), entry("2026-01-02")];

    expect(computeHistoryStats(history).totalCount).toBe(2);
  });

  it("calcula a sequência de dias consecutivos mais recente", () => {
    const history = [
      entry("2026-01-05T10:00:00"),
      entry("2026-01-04T10:00:00"),
      entry("2026-01-03T10:00:00"),
      entry("2026-01-01T10:00:00"), // quebra a sequência (pulou o dia 2)
    ];

    expect(computeHistoryStats(history).currentStreak).toBe(3);
  });

  it("conta várias mensagens no mesmo dia como um único dia da sequência", () => {
    const history = [
      entry("2026-01-02T09:00:00"),
      entry("2026-01-02T18:00:00"),
      entry("2026-01-01T09:00:00"),
    ];

    expect(computeHistoryStats(history).currentStreak).toBe(2);
  });

  it("sequência é 1 quando só há um dia com mensagens", () => {
    const history = [entry("2026-01-01"), entry("2025-12-20")];

    expect(computeHistoryStats(history).currentStreak).toBe(1);
  });

  it("encontra o objetivo mais comum quando há repetição", () => {
    const history = [
      entry("2026-01-01", "relaxar"),
      entry("2026-01-02", "relaxar"),
      entry("2026-01-03", "dançar"),
    ];

    expect(computeHistoryStats(history).topObjetivo).toEqual({
      objetivo: "relaxar",
      count: 2,
    });
  });

  it("não retorna objetivo mais comum quando nenhum se repete", () => {
    const history = [
      entry("2026-01-01", "relaxar"),
      entry("2026-01-02", "dançar"),
    ];

    expect(computeHistoryStats(history).topObjetivo).toBeNull();
  });
});
