type HistoryEntry = {
  emotion: {
    energia_atual?: string;
    generos_sugeridos?: string[];
  };
};

export function computeMoodStats(history: HistoryEntry[]) {
  const energyDistribution = { baixa: 0, media: 0, alta: 0 };
  const generoCounts = new Map<string, number>();

  history.forEach((h) => {
    const energia = h.emotion?.energia_atual;

    if (energia && energia in energyDistribution) {
      energyDistribution[energia as keyof typeof energyDistribution] += 1;
    }

    (h.emotion?.generos_sugeridos ?? []).forEach((genero) => {
      generoCounts.set(genero, (generoCounts.get(genero) ?? 0) + 1);
    });
  });

  const topGeneros = Array.from(generoCounts.entries())
    .map(([genero, count]) => ({ genero, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { energyDistribution, topGeneros };
}
