import { describe, expect, it } from "vitest";
import { computeFeedbackStats } from "./feedbackStats";

describe("computeFeedbackStats", () => {
  it("retorna likeRate nulo quando não há avaliações", () => {
    expect(computeFeedbackStats([])).toEqual({
      total: 0,
      likes: 0,
      dislikes: 0,
      likeRate: null,
    });
  });

  it("calcula a taxa de acerto com base nas avaliações", () => {
    const rows = [
      { rating: 1 },
      { rating: 1 },
      { rating: 1 },
      { rating: -1 },
    ];

    expect(computeFeedbackStats(rows)).toEqual({
      total: 4,
      likes: 3,
      dislikes: 1,
      likeRate: 75,
    });
  });
});
