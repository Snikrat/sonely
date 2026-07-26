type FeedbackRow = { rating: number };

export function computeFeedbackStats(rows: FeedbackRow[]) {
  const likes = rows.filter((r) => r.rating === 1).length;
  const dislikes = rows.filter((r) => r.rating === -1).length;
  const total = likes + dislikes;
  const likeRate = total > 0 ? Math.round((likes / total) * 100) : null;

  return { total, likes, dislikes, likeRate };
}
