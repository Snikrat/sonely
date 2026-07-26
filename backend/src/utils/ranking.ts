type TopTrack = { name: string; artist: string };

export function rankTracks(
  tracks: any[],
  generos: string[],
  vibes: string[],
  evitar: string[],
  perfilGeneros: string[],
  topArtists: string[] = [],
  topTracks: TopTrack[] = [],
  feedback: Record<string, number> = {},
) {
  const topArtistsNorm = topArtists.map((a) => a.toLowerCase());
  const topTracksNorm = topTracks.map(
    (t) => `${t.name}|${t.artist}`.toLowerCase(),
  );

  return tracks
    .map((track) => {
      let score = 0;

      const name = (track.name || "").toLowerCase();
      const artist = (track.artist || "").toLowerCase();

      // emoção atual
      generos.forEach((g) => {
        const gNorm = g.toLowerCase();
        if (name.includes(gNorm) || artist.includes(gNorm)) score += 2;
      });

      // vibes
      vibes.forEach((v) => {
        if (name.includes(v.toLowerCase())) score += 1;
      });

      // histórico de mensagens do usuário
      perfilGeneros.forEach((g) => {
        const gNorm = g.toLowerCase();
        if (name.includes(gNorm) || artist.includes(gNorm)) score += 2;
      });

      // artista realmente favorito do usuário no Spotify (sinal forte)
      if (
        artist &&
        topArtistsNorm.some((a) => artist.includes(a) || a.includes(artist))
      ) {
        score += 4;
      }

      // a própria faixa já está entre as mais ouvidas do usuário (sinal mais forte ainda)
      if (topTracksNorm.includes(`${name}|${artist}`)) {
        score += 6;
      }

      // evitar
      evitar.forEach((e) => {
        if (name.includes(e.toLowerCase())) score -= 3;
      });

      // feedback explícito do usuário em recomendações passadas
      const userRating = feedback[`${name}|${artist}`] ?? 0;
      score += userRating * 8;

      return { ...track, score, feedback: userRating };
    })
    .sort((a, b) => b.score - a.score);
}
