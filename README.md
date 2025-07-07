# DMGPT5e - D&D 5e AI Assistant

A Next.js application that uses AI to assist with all aspects of D&D 5e gameplay, from character creation to rule lookups.

## 🎲 Features

- **AI-Powered D&D Assistant**: Get help with character creation, rule questions, spell lookups, and more
- **Real-time Chat Interface**: Interactive conversations with streaming responses
- **User Authentication**: Secure login and data management
- **Campaign Management**: Create and join D&D campaigns
- **Character Storage**: Save and manage multiple characters
- **Rule Lookups**: Quick access to D&D 5e rules and mechanics

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL (via Prisma)
- **AI**: Ollama for LLM
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
OLLAMA_MODEL="dmgpt5e"
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

### 4. Setup AI Model

```bash
# Run the setup script (downloads model if needed and configures Ollama)
./setup-ollama.sh

# Start Ollama server
ollama serve
```

### 5. Start Development Server

```bash
npm run dev
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start your D&D adventure!

---

## 📋 **What the Setup Script Does**

The `setup-ollama.sh` script automatically:

1. **Downloads the AI model** (4.9GB) from Hugging Face if not present
2. **Creates Ollama configuration** with memory optimization
3. **Registers the model** with Ollama for API access
4. **Validates the setup** and provides testing instructions

**Model Details:**
- **Source**: [DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored-GGUF](https://huggingface.co/QuantFactory/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored-GGUF)
- **Size**: ~4.9GB (Q4_K_M quantization)
- **Memory Usage**: Optimized for systems with 8GB+ RAM



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
- `src/lib/ollama.ts` - Ollama integration
- `src/app/api/characters/creation/route.ts` - AI chat endpoint
- `src/components/CharacterCreationModal.tsx` - Character creation UI

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤖 AI Integration

### Ollama Setup
The application uses Ollama for LLM responses with a local model:

1. **Automatic Setup**: Run the setup script to download and configure everything:
   ```bash
   ./setup-ollama.sh
   ```

2. **LLM Model**: Uses the DarkIdol-Llama-3.1-8B-Instruct model via Ollama
3. **API Endpoints**: 
   - `/api/characters/creation` for character creation assistance

### Model Configuration
- **Model File**: `data/model/model.gguf` (~4.9GB, Q4_K_M quantization)
- **Ollama Model Name**: `dmgpt5e` (memory-optimized configuration)
- **API Endpoint**: `http://localhost:11434`
- **Context Window**: 4096 tokens
- **Memory Usage**: Optimized for 8GB+ systems
- **Source**: [Hugging Face](https://huggingface.co/QuantFactory/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored-GGUF)

## 🛠️ Customization



### Changing AI Models
Update environment variables:
```env
OLLAMA_MODEL="your-preferred-model"
```

### Modifying AI Behavior
Edit the system prompt in `src/app/api/characters/creation/route.ts` to change how the AI responds to different types of questions.

## 🐛 Troubleshooting

### Common Issues

**Ollama Connection Error**
```bash
# Ensure Ollama is running: ollama serve
# Check available models: ollama list
# Verify model is created: ollama run dmgpt5e "test"
# Re-run setup if needed: ./setup-ollama.sh
```

**Model Download Issues**
```bash
# Check internet connection
# Verify disk space (need ~5GB free)
# Re-run setup: ./setup-ollama.sh
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