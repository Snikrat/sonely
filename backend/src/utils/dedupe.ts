type NamedTrack = { name: string; artist: string };

// Remove repetições consecutivas da mesma faixa (ex: tocou a mesma música
// duas vezes seguidas) sem esconder a faixa se ela tocar de novo mais tarde,
// depois de outra faixa ter tocado no meio.
export function dedupeConsecutiveTracks<T extends NamedTrack>(
  tracks: T[],
): T[] {
  return tracks.filter((track, index) => {
    if (index === 0) return true;

    const previous = tracks[index - 1];
    return !(track.name === previous.name && track.artist === previous.artist);
  });
}
