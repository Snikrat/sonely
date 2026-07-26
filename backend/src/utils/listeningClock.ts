type PlayedTrack = { playedAt: string };

const PERIOD_LABELS = [
  { label: "madrugada", start: 0, end: 6 },
  { label: "manhã", start: 6, end: 12 },
  { label: "tarde", start: 12, end: 18 },
  { label: "noite", start: 18, end: 24 },
];

function periodForHour(hour: number) {
  return PERIOD_LABELS.find((p) => hour >= p.start && hour < p.end)?.label ?? "noite";
}

export function computeListeningClock(tracks: PlayedTrack[]) {
  if (tracks.length === 0) {
    return { peakHour: null as number | null, peakPeriod: null as string | null };
  }

  const hourCounts = new Array(24).fill(0);

  tracks.forEach((t) => {
    const hour = new Date(t.playedAt).getHours();
    if (!Number.isNaN(hour)) hourCounts[hour] += 1;
  });

  let peakHour = 0;
  for (let hour = 1; hour < 24; hour++) {
    if (hourCounts[hour] > hourCounts[peakHour]) peakHour = hour;
  }

  if (hourCounts[peakHour] === 0) {
    return { peakHour: null, peakPeriod: null };
  }

  return { peakHour, peakPeriod: periodForHour(peakHour) };
}
