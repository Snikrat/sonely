import { describe, expect, it } from "vitest";
import { computeLikeDayOfWeek } from "./likeStats";

// 2026-01-04 é um domingo, 2026-01-05 uma segunda (usado como referência
// fixa pra não depender do dia em que o teste roda).
function at(daysFromSunday: number) {
  const date = new Date(2026, 0, 4 + daysFromSunday, 12, 0, 0);
  return { addedAt: date.toISOString() };
}

describe("computeLikeDayOfWeek", () => {
  it("retorna nulo quando não há faixas curtidas", () => {
    expect(computeLikeDayOfWeek([])).toEqual({ peakDay: null });
  });

  it("ignora faixas sem addedAt", () => {
    expect(computeLikeDayOfWeek([{}, {}])).toEqual({ peakDay: null });
  });

  it("encontra o dia da semana com mais curtidas", () => {
    const likedSongs = [at(1), at(1), at(1), at(0), at(3)];

    expect(computeLikeDayOfWeek(likedSongs).peakDay).toBe("segunda");
  });
});
