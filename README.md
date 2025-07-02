# DMGPT5e - D&D 5e AI Assistant

A Next.js application that uses AI to assist with all aspects of D&D 5e gameplay, from character creation to rule lookups, with a comprehensive vector store of D&D rules and content for accurate, contextual responses.

## 🎲 Features

- **AI-Powered D&D Assistant**: Get help with character creation, rule questions, spell lookups, and more
- **Comprehensive D&D Knowledge Base**: Vector store containing all D&D 5e rules, spells, classes, races, monsters, and more
- **Real-time Chat Interface**: Interactive conversations with streaming responses
- **User Authentication**: Secure login and data management
- **Campaign Management**: Create and join D&D campaigns
- **Character Storage**: Save and manage multiple characters
- **Rule Lookups**: Quick access to D&D 5e rules and mechanics

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL (via Prisma)
- **AI**: Ollama for LLM and embeddings
- **Vector Store**: In-memory vector store with cosine similarity search
- **Authentication**: NextAuth.js

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Ollama installed and running locally

### 1. Clone and Install

```bash
git clone <repository-url>
cd dmgpt5e
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dmgpt5e"

# Authentication (NextAuth)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Ollama Configuration
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) View database in Prisma Studio
npx prisma studio
```

### 4. Start Ollama

```bash
# Start Ollama server
ollama serve

# Pull the model (in another terminal)
ollama pull llama3.1:8b
```

### 5. Build Vector Store

```bash
# Build the comprehensive D&D knowledge base
npm run build:vectors
```

This creates embeddings for all D&D 5e content from both 2014 and 2024 data sources.

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start your D&D adventure!

## 📚 Vector Store

The application includes a comprehensive vector store of D&D 5e content:

### Data Sources
- **2014 Data**: Complete D&D 5e content (spells, monsters, classes, races, etc.)
- **2024 Data**: Updated rules and new content (skills, conditions, etc.)

### Content Types
- Spells (15,000+ entries)
- Monsters
- Classes and Subclasses
- Races and Subraces
- Backgrounds
- Equipment and Magic Items
- Skills, Conditions, Damage Types
- Rules and Features

### How It Works
1. **Embedding Generation**: Uses Ollama to create vector embeddings for all D&D content
2. **Similarity Search**: Finds relevant content using cosine similarity
3. **Context Injection**: Provides relevant D&D information to the LLM during conversations
4. **Smart Updates**: 2024 data automatically overwrites 2014 data for updated content

## 🎯 Usage

### General D&D Assistance
- **Ask about rules**: "How does grappling work?"
- **Spell lookups**: "Tell me about Fireball"
- **Class information**: "What are the Fighter's features?"
- **Monster stats**: "What are the stats for a dragon?"
- **Equipment questions**: "What weapons can a wizard use?"

### Character Creation
1. **Login** to your account
2. **Click "Create Character"** to start the AI-guided process
3. **Answer questions** about your character concept
4. **Review choices** and make adjustments
5. **Save your character** when complete

### Campaign Management
- **Create campaigns** for your D&D sessions
- **Join public campaigns** or invite players
- **Manage character assignments** to campaigns

## 🔧 Development

### Project Structure
```
dmgpt5e/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   └── dashboard/      # Dashboard pages
│   ├── components/         # React components
│   ├── lib/               # Utilities and configurations
│   └── hooks/             # Custom React hooks
├── data/                  # D&D 5e data files
│   ├── 2014/             # Original D&D 5e content
│   └── 2024/             # Updated content
├── prisma/               # Database schema and migrations
└── scripts/              # Build and utility scripts
```

### Key Files
- `src/lib/simpleVectorStore.ts` - Vector store implementation
- `src/lib/ollama.ts` - Ollama integration
- `src/app/api/dnd/chat/route.ts` - AI chat endpoint
- `src/components/CharacterCreationModal.tsx` - Character creation UI

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run build:vectors # Build the vector store
```

## 🤖 AI Integration

### Ollama Setup
The application uses Ollama for both LLM responses and embeddings:

1. **LLM Model**: `llama3.1:8b` for D&D conversations
2. **Embedding Model**: Uses the same model for generating embeddings
3. **API Endpoints**: 
   - `/api/chat` for LLM responses
   - `/api/embeddings` for vector generation

### Vector Store Integration
- **Real-time Queries**: Each user message triggers a vector search
- **Context Injection**: Relevant D&D content is included in LLM prompts
- **Smart Grouping**: Results are organized by content type (spells, skills, etc.)

## 🛠️ Customization

### Adding New Data Sources
1. Add JSON files to `data/` directory
2. Update `processDataItem()` in `simpleVectorStore.ts`
3. Rebuild vector store: `npm run build:vectors`

### Changing AI Models
Update environment variables:
```env
OLLAMA_MODEL="your-preferred-model"
```

### Modifying AI Behavior
Edit the system prompt in `src/app/api/dnd/chat/route.ts` to change how the AI responds to different types of questions.

## 🐛 Troubleshooting

### Common Issues

**Ollama Connection Error**
```bash
# Ensure Ollama is running
ollama serve

# Check available models
ollama list
```

**Vector Store Build Fails**
```bash
# Check data files exist
ls data/2014/ data/2024/

# Rebuild vector store
npm run build:vectors
```

**Database Connection Issues**
```bash
# Check database is running
# Verify DATABASE_URL in .env.local
# Run migrations
npx prisma db push
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🙏 Acknowledgments

- D&D 5e data from [5e-bits/5e-database](https://github.com/5e-bits/5e-database)
- Ollama for local AI inference
- Next.js and the React ecosystem 