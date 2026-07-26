import type { Insights } from "../types/recommendation";

const WIDTH = 1080;
const PADDING = 80;

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStatTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  roundRect(ctx, x, y, w, h, 20);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#f8f5fc";
  ctx.font = "700 56px Inter, sans-serif";
  ctx.fillText(value, x + w / 2, y + h / 2 - 5);

  ctx.fillStyle = "#a993b8";
  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillText(label, x + w / 2, y + h / 2 + 45);
}

// Executa o layout inteiro em modo "medida" (draw=false) pra descobrir a
// altura final antes de criar o canvas real, evitando conteúdo cortado.
function runLayout(
  ctx: CanvasRenderingContext2D,
  userName: string,
  data: Insights,
  draw: boolean,
) {
  let y = 110;

  ctx.textAlign = "center";
  ctx.fillStyle = "#f0469a";
  ctx.font = "700 34px Inter, sans-serif";
  if (draw) ctx.fillText("🎧 SONELY", WIDTH / 2, y);

  y += 70;
  ctx.fillStyle = "#f8f5fc";
  ctx.font = "700 42px Inter, sans-serif";
  if (draw) {
    ctx.fillText(`perfil musical${userName ? ` de ${userName}` : ""}`, WIDTH / 2, y);
  }

  y += 70;

  const tileY = y;
  const tileW = (WIDTH - PADDING * 2 - 30) / 2;
  const tileH = 180;
  if (draw) {
    drawStatTile(
      ctx,
      PADDING,
      tileY,
      tileW,
      tileH,
      `${data.explicitPercentage}%`,
      "faixas explícitas",
    );
    drawStatTile(
      ctx,
      PADDING + tileW + 30,
      tileY,
      tileW,
      tileH,
      formatDuration(data.avgDurationMs),
      "duração média",
    );
  }
  y += tileH + 60;

  if (data.decades.length > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#cabdd6";
    ctx.font = "700 30px Inter, sans-serif";
    if (draw) ctx.fillText("linha do tempo musical", PADDING, y);
    y += 40;

    const maxCount = Math.max(1, ...data.decades.map((d) => d.count));
    const trackX = PADDING + 110;
    const trackW = WIDTH - PADDING - trackX - 70;
    const trackH = 28;

    data.decades.forEach((d) => {
      if (draw) {
        ctx.fillStyle = "#cabdd6";
        ctx.font = "600 26px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(d.decade, PADDING, y + 22);

        ctx.fillStyle = "rgba(240, 70, 154, 0.12)";
        roundRect(ctx, trackX, y, trackW, trackH, 14);
        ctx.fill();

        const barW = Math.max(14, (d.count / maxCount) * trackW);
        const barGrad = ctx.createLinearGradient(trackX, 0, trackX + barW, 0);
        barGrad.addColorStop(0, "#f0469a");
        barGrad.addColorStop(1, "#9333ea");
        ctx.fillStyle = barGrad;
        roundRect(ctx, trackX, y, barW, trackH, 14);
        ctx.fill();

        ctx.fillStyle = "#8d7d99";
        ctx.font = "600 24px Inter, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(String(d.count), WIDTH - PADDING, y + 21);
      }

      y += trackH + 20;
    });

    y += 30;
  }

  if (data.consistentArtists.length > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#cabdd6";
    ctx.font = "700 30px Inter, sans-serif";
    if (draw) ctx.fillText("favoritos de sempre", PADDING, y);
    y += 50;

    let x = PADDING;
    const chipH = 56;
    ctx.font = "600 26px Inter, sans-serif";

    data.consistentArtists.forEach((artist) => {
      const textW = ctx.measureText(artist.name).width;
      const chipW = textW + 48;

      if (x + chipW > WIDTH - PADDING && x > PADDING) {
        x = PADDING;
        y += chipH + 16;
      }

      if (draw) {
        ctx.fillStyle = "rgba(240, 70, 154, 0.14)";
        roundRect(ctx, x, y, chipW, chipH, 28);
        ctx.fill();

        ctx.fillStyle = "#f0469a";
        ctx.textAlign = "left";
        ctx.fillText(artist.name, x + 24, y + 37);
      }

      x += chipW + 16;
    });

    y += chipH + 40;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#8d7d99";
  ctx.font = "500 22px Inter, sans-serif";
  if (draw) ctx.fillText("gerado em sonely", WIDTH / 2, y + 20);
  y += 60;

  return y;
}

export function generateRecapCanvas(
  userName: string,
  data: Insights,
): HTMLCanvasElement {
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = WIDTH;
  measureCanvas.height = 10;
  const measureCtx = measureCanvas.getContext("2d")!;
  const finalHeight = runLayout(measureCtx, userName, data, false);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = finalHeight;
  const ctx = canvas.getContext("2d")!;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#1a0f24");
  bgGrad.addColorStop(1, "#0a0610");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const radial = ctx.createRadialGradient(
    WIDTH / 2,
    0,
    0,
    WIDTH / 2,
    0,
    700,
  );
  radial.addColorStop(0, "rgba(236, 72, 153, 0.22)");
  radial.addColorStop(1, "rgba(236, 72, 153, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  runLayout(ctx, userName, data, true);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
