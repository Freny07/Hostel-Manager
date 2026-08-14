/**
 * ML Semantic Embedding & Cosine Similarity Service Helper
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export interface EmbeddingApiResponse {
  embedding: number[];
  dimension: number;
  model: string;
  text_length: number;
}

/**
 * Safely fetches a 384-dimensional vector embedding from the Python ML microservice.
 * Returns null if the service is unreachable or fails.
 */
export async function fetchTextEmbedding(
  title: string,
  text: string
): Promise<number[] | null> {
  const cleanedText = text?.trim() || "";
  if (!cleanedText) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${ML_SERVICE_URL}/api/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title?.trim() || undefined,
        text: cleanedText,
        normalize: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as EmbeddingApiResponse;
    if (data && Array.isArray(data.embedding)) {
      return data.embedding;
    }
    return null;
  } catch {
    // Graceful fallback if ML service is unavailable
    return null;
  }
}

/**
 * Calculates cosine similarity between two normalized floating-point vectors.
 */
export function calculateCosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
}

/**
 * Computes composite similarity score incorporating category and location signals.
 */
export function computeCompositeSimilarity({
  baseSimilarity,
  sameCategory,
  sameRoom,
  sameHostel,
}: {
  baseSimilarity: number;
  sameCategory: boolean;
  sameRoom: boolean;
  sameHostel: boolean;
}): number {
  let score = baseSimilarity * 0.7;

  if (sameCategory) score += 0.15;
  if (sameRoom) score += 0.15;
  else if (sameHostel) score += 0.05;

  return Math.max(0, Math.min(1, score));
}
