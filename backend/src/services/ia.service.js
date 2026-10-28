import Groq from "groq-sdk";
import { AppError } from "../utils/AppError.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function poserQuestion(question, historique = [], nomEcole = "notre école") {
  if (!question) throw new AppError(400, "La question est vide.");

  // On définit le rôle de l'assistant pour qu'il agisse comme un tuteur
  const messages = [
    {
      role: "system",
      content: `Tu es un assistant pédagogique amical et serviable pour la plateforme de formation "${nomEcole}". 
      Tu aides les apprenants à comprendre leurs cours, tu les guides pour trouver la bonne réponse sans leur donner directement la solution, et tu réponds de manière claire et concise.`
    },
    ...historique, // L'historique de la conversation
    { role: "user", content: question }
  ];

  try {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "Désolé, je n'ai pas de réponse pour le moment.";
  } catch (error) {
    console.error("Erreur API Groq:", error);
    throw new AppError(500, "L'assistant IA est momentanément indisponible.");
  }
}
