type HistoryRow = {
  createdAt: Date | string;
  emotion: { objetivo?: string };
};

function toDayTimestamp(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function computeHistoryStats(history: HistoryRow[]) {
  const totalCount = history.length;

  if (totalCount === 0) {
    return {
      totalCount: 0,
      currentStreak: 0,
      topObjetivo: null as { objetivo: string; count: number } | null,
    };
  }

  const days = Array.from(
    new Set(history.map((h) => toDayTimestamp(new Date(h.createdAt)))),
  ).sort((a, b) => b - a);

  let currentStreak = 1;

  for (let i = 1; i < days.length; i++) {
    const diffDays = Math.round((days[i - 1] - days[i]) / 86400000);

    if (diffDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  const objetivoCounts = new Map<string, number>();

  history.forEach((h) => {
    const objetivo = h.emotion?.objetivo;
    if (objetivo) {
      objetivoCounts.set(objetivo, (objetivoCounts.get(objetivo) ?? 0) + 1);
    }
  });

  let topObjetivo: { objetivo: string; count: number } | null = null;

  objetivoCounts.forEach((count, objetivo) => {
    if (count > 1 && (!topObjetivo || count > topObjetivo.count)) {
      topObjetivo = { objetivo, count };
    }
  });

  return { totalCount, currentStreak, topObjetivo };
}
