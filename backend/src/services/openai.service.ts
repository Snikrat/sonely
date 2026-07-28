import axios from "axios";

type EmotionResponse = {
  sentimento_atual: string;
  energia_atual: "baixa" | "media" | "alta";
  objetivo: string;
  vibes: string[];
  generos_sugeridos: string[];
  evitar: string[];
};

export async function analyzeEmotion(
  message: string,
): Promise<EmotionResponse> {
  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.4-mini",

      text: {
        format: {
          type: "json_schema",
          name: "emotion_schema",
          schema: {
            type: "object",
            properties: {
              sentimento_atual: { type: "string" },
              energia_atual: {
                type: "string",
                enum: ["baixa", "media", "alta"],
              },
              objetivo: { type: "string" },
              vibes: {
                type: "array",
                items: { type: "string" },
              },
              generos_sugeridos: {
                type: "array",
                items: { type: "string" },
              },
              evitar: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "sentimento_atual",
              "energia_atual",
              "objetivo",
              "vibes",
              "generos_sugeridos",
              "evitar",
            ],

            // 🔥 ESSA LINHA É O QUE FALTAVA
            additionalProperties: false,
          },
        },
      },

      input: `
Analise o texto do usuário e extraia o estado emocional.

Retorne SOMENTE JSON válido.

Texto:
"${message}"
`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const content = response.data.output?.[0]?.content?.[0]?.text;

  if (!content) {
    console.error("Resposta inesperada da OpenAI:", response.data);
    throw new Error("Resposta da OpenAI inválida");
  }

  return JSON.parse(content);
}

type TrackRef = { name: string; artist: string };
type TrackSuggestion = { title: string; artist: string };

export async function generatePlaylistTrackSuggestions(params: {
  prompt: string;
  count: number;
  keep: TrackRef[];
  exclude: TrackRef[];
}): Promise<TrackSuggestion[]> {
  const { prompt, count, keep, exclude } = params;

  const keepText = keep.length
    ? keep.map((t) => `- ${t.name} - ${t.artist}`).join("\n")
    : "(nenhuma ainda)";

  const excludeText = exclude.length
    ? exclude.map((t) => `- ${t.name} - ${t.artist}`).join("\n")
    : "(nenhuma ainda)";

  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.4-mini",

      text: {
        format: {
          type: "json_schema",
          name: "playlist_suggestions_schema",
          schema: {
            type: "object",
            properties: {
              tracks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    artist: { type: "string" },
                  },
                  required: ["title", "artist"],
                  additionalProperties: false,
                },
              },
            },
            required: ["tracks"],
            additionalProperties: false,
          },
        },
      },

      input: `
Você é um curador musical. Um usuário descreveu o tipo de playlist que
quer ouvir. Sugira ${count} músicas REAIS e existentes (não invente
faixas) que combinem com o pedido dele.

Pedido do usuário:
"${prompt}"

Músicas que o usuário já marcou como favoritas nesta playlist (siga o
estilo/vibe delas):
${keepText}

Músicas que já foram sugeridas antes e NÃO devem se repetir:
${excludeText}

Retorne SOMENTE JSON válido com exatamente ${count} sugestões, cada uma com
o título exato da música e o nome do artista principal.
`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const content = response.data.output?.[0]?.content?.[0]?.text;

  if (!content) {
    console.error("Resposta inesperada da OpenAI:", response.data);
    throw new Error("Resposta da OpenAI inválida");
  }

  const parsed = JSON.parse(content);
  return parsed.tracks ?? [];
}

export async function generatePlaylistDescription(params: {
  prompt: string;
  tracks: TrackRef[];
}): Promise<string> {
  const { prompt, tracks } = params;

  const trackList = tracks.map((t) => `${t.name} - ${t.artist}`).join(", ");

  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: "gpt-5.4-mini",

      input: `
Escreva uma descrição curta (no máximo 300 caracteres) em português para
uma playlist do Spotify, em tom envolvente e pessoal.

O usuário pediu:
"${prompt}"

A playlist final tem estas músicas:
${trackList}

Responda APENAS com o texto da descrição, sem aspas e sem explicações.
`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const content = response.data.output?.[0]?.content?.[0]?.text;

  if (!content) {
    console.error("Resposta inesperada da OpenAI:", response.data);
    throw new Error("Resposta da OpenAI inválida");
  }

  return content.trim().slice(0, 300);
}
