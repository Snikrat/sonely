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
