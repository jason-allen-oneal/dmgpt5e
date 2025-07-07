// lib/ollama.ts

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "dmgpt5e"

export { OLLAMA_BASE_URL, OLLAMA_MODEL } 