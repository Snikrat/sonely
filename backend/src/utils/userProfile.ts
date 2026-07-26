export function buildUserProfile(history: any[]) {
  const generos: Record<string, number> = {};
  const evitar: Record<string, number> = {};

  history.forEach((h) => {
    h.emotion.generos_sugeridos.forEach((g: string) => {
      generos[g] = (generos[g] || 0) + 1;
    });

    h.emotion.evitar.forEach((e: string) => {
      evitar[e] = (evitar[e] || 0) + 1;
    });
  });

  const topGeneros = Object.keys(generos).sort(
    (a, b) => generos[b] - generos[a],
  );

  const topEvitar = Object.keys(evitar).sort((a, b) => evitar[b] - evitar[a]);

  return {
    generos: topGeneros.slice(0, 5),
    evitar: topEvitar.slice(0, 5),
  };
}
