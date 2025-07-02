// lib/ollama.ts

import fetch from "node-fetch";

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b"
  // Adjust based on the available models you want

export { OLLAMA_BASE_URL, OLLAMA_MODEL }

/**
 * Get an embedding vector for a given text using Ollama's embedding API.
 * @param text The text to embed
 * @returns Promise<number[]> The embedding vector
 */
export async function getOllamaEmbedding(text: string): Promise<number[]> {
  // Try nomic-embed-text first, fallback to the main model
  const models = [OLLAMA_MODEL];
  
  for (const model of models) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: text }),
      });
      
      if (response.ok) {
        const data = (await response.json()) as any;
        console.log(`Successfully used ${model} for embedding`);
        return data.embedding;
      } else {
        console.log(`Model ${model} failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`Error with model ${model}:`, error);
    }
  }
  
  throw new Error(`No working embedding model found. Tried: ${models.join(", ")}`);
}
