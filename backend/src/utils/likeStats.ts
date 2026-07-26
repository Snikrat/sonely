type LikedTrack = { addedAt?: string };

const DAY_NAMES = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export function computeLikeDayOfWeek(likedSongs: LikedTrack[]) {
  const dayCounts = new Array(7).fill(0);
  let counted = 0;

  likedSongs.forEach((t) => {
    if (!t.addedAt) return;

    const day = new Date(t.addedAt).getDay();
    if (Number.isNaN(day)) return;

    dayCounts[day] += 1;
    counted += 1;
  });

  if (counted === 0) {
    return { peakDay: null as string | null };
  }

  let peakIndex = 0;
  for (let i = 1; i < 7; i++) {
    if (dayCounts[i] > dayCounts[peakIndex]) peakIndex = i;
  }

  return { peakDay: DAY_NAMES[peakIndex] };
}
