import { describe, expect, it } from "vitest";
import { computeListeningClock } from "./listeningClock";

// Constrói o horário em hora LOCAL e converte pra ISO, pra o teste não
// depender do fuso horário de quem está rodando (Date#getHours() na
// implementação também lê hora local).
function at(hour: number, day = "2026-01-01") {
  const [year, month, date] = day.split("-").map(Number);
  return { playedAt: new Date(year, month - 1, date, hour, 0, 0).toISOString() };
}

describe("computeListeningClock", () => {
  it("retorna nulo quando não há faixas", () => {
    expect(computeListeningClock([])).toEqual({
      peakHour: null,
      peakPeriod: null,
    });
  });

  it("encontra a hora com mais faixas tocadas", () => {
    const tracks = [at(21), at(21), at(21), at(9), at(14)];

    const result = computeListeningClock(tracks);

    expect(result.peakHour).toBe(21);
    expect(result.peakPeriod).toBe("noite");
  });

  it("classifica os períodos do dia corretamente", () => {
    expect(computeListeningClock([at(3), at(3)]).peakPeriod).toBe("madrugada");
    expect(computeListeningClock([at(8), at(8)]).peakPeriod).toBe("manhã");
    expect(computeListeningClock([at(15), at(15)]).peakPeriod).toBe("tarde");
    expect(computeListeningClock([at(20), at(20)]).peakPeriod).toBe("noite");
  });
});
