import { getOllamaEmbedding } from "./ollama";
import fs from "fs";
import path from "path";

// Type for a stored item
export type VectorItem = {
  id: string;
  text: string;
  embedding: number[];
  metadata: any;
};

// Type for a scored item (returned from queries)
export type ScoredVectorItem = VectorItem & {
  score: number;
};

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

// Data directories and store path
const DATA_2014_DIR = path.join(__dirname, "../../data/2014");
const DATA_2024_DIR = path.join(__dirname, "../../data/2024");
const STORE_PATH = path.join(__dirname, "../../data/dnd_vectors.json");

// Helper function to process different data types
function processDataItem(item: any, type: string, version: string): string {
  // Helper function to safely get description text
  const getDescText = (desc: any): string => {
    if (Array.isArray(desc)) {
      return desc.join(" ");
    } else if (typeof desc === 'string') {
      return desc;
    }
    return "";
  };

  switch (type) {
    case 'skills':
      return `${item.name}: ${item.description}`;
    case 'conditions':
      return `${item.name}: ${item.description}`;
    case 'damage-types':
      return `${item.name}: ${item.description}`;
    case 'magic-schools':
      return `${item.name}: ${item.description}`;
    case 'weapon-properties':
      return `${item.name}: ${item.description}`;
    case 'weapon-mastery-properties':
      return `${item.name}: ${item.description}`;
    case 'ability-scores':
      return `${item.name}: ${item.description}`;
    case 'alignments':
      return `${item.name}: ${item.description}`;
    case 'languages':
      return `${item.name}: ${item.description}`;
    case 'spells':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'monsters':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'classes':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'races':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'backgrounds':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'equipment':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'magic-items':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'features':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'traits':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'subclasses':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'subraces':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'feats':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'levels':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'proficiencies':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'rules':
      return `${item.name}: ${getDescText(item.desc)}`;
    case 'rule-sections':
      return `${item.name}: ${getDescText(item.desc)}`;
    default:
      return `${item.name}: ${item.description || getDescText(item.desc) || JSON.stringify(item)}`;
  }
}

export async function buildVectorStore() {
  const store: VectorItem[] = [];
  const processedIds = new Set<string>(); // Track processed IDs to handle duplicates
  
  // Process 2014 data first (comprehensive content)
  console.log("Processing 2014 data files...");
  const files2014 = fs.readdirSync(DATA_2014_DIR).filter(file => file.endsWith('.json'));
  
  for (const file of files2014) {
    const filePath = path.join(DATA_2014_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const type = file.replace('5e-SRD-', '').replace('.json', '');
    
    console.log(`Processing 2014 ${file} (${data.length} items)...`);
    
    for (const item of data) {
      const text = processDataItem(item, type, '2014');
      const embedding = await getOllamaEmbedding(text);
      const id = `${type}-${item.index}`;
      
      store.push({
        id,
        text,
        embedding,
        metadata: {
          name: item.name,
          type: type,
          version: '2014',
          source: file,
          ...item // Include all original data
        }
      });
      
      processedIds.add(id);
      console.log(`  Embedded: ${item.name} (${type})`);
    }
  }
  
  // Process 2024 data (updates and new content)
  console.log("\nProcessing 2024 data files...");
  const files2024 = fs.readdirSync(DATA_2024_DIR).filter(file => file.endsWith('.json'));
  
  for (const file of files2024) {
    const filePath = path.join(DATA_2024_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const type = file.replace('5e-SRD-', '').replace('.json', '');
    
    console.log(`Processing 2024 ${file} (${data.length} items)...`);
    
    for (const item of data) {
      const text = processDataItem(item, type, '2024');
      const embedding = await getOllamaEmbedding(text);
      const id = `${type}-${item.index}`;
      
      // If this ID already exists, remove the old version
      if (processedIds.has(id)) {
        const existingIndex = store.findIndex(s => s.id === id);
        if (existingIndex !== -1) {
          store.splice(existingIndex, 1);
          console.log(`  Updated: ${item.name} (${type}) - replaced 2014 version`);
        }
      }
      
      store.push({
        id,
        text,
        embedding,
        metadata: {
          name: item.name,
          type: type,
          version: '2024',
          source: file,
          ...item // Include all original data
        }
      });
      
      processedIds.add(id);
      console.log(`  Embedded: ${item.name} (${type})`);
    }
  }
  
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  console.log(`\nVector store built and saved with ${store.length} items.`);
  console.log(`Data sources: 2014 (${files2014.length} files) + 2024 (${files2024.length} files)`);
}

export function loadVectorStore(): VectorItem[] {
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

export async function queryVectorStore(query: string, n = 3): Promise<ScoredVectorItem[]> {
  const store = loadVectorStore();
  const queryEmbedding = await getOllamaEmbedding(query);
  const scored = store.map(item => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding)
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
} 