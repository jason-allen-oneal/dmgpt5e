import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ollama"
import { queryVectorStore, ScoredVectorItem } from "@/lib/simpleVectorStore"

export async function POST(request: NextRequest) {
  console.log("=== CHAT API CALL START ===")
  console.log("Timestamp:", new Date().toISOString())
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("Session check:", session ? "Authenticated" : "No session")
    if (!session) {
      console.log("Authentication failed - returning 401")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { message, conversationHistory, sessionId, context } = await request.json()
    
    // Convert message to string if it's a number or other type
    const messageString = typeof message === 'string' ? message : String(message)
    
    console.log("Request data:", {
      message: typeof messageString === 'string' ? (messageString.substring(0, 100) + (messageString.length > 100 ? "..." : "")) : `[${typeof messageString}] ${messageString}`,
      sessionId,
      context,
      conversationHistoryLength: conversationHistory?.length || 0
    })

    if (!message) {
      console.log("No message provided - returning 400")
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    if (!sessionId) {
      console.log("No sessionId provided - returning 400")
      return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 })
    }

    // Check if Ollama is available
    console.log("Ollama base URL:", OLLAMA_BASE_URL)
    console.log("Ollama model:", OLLAMA_MODEL)

    // Query vector store for relevant D&D data
    let relevantData: ScoredVectorItem[] = []
    try {
      console.log("Querying vector store for relevant D&D data...")
      relevantData = await queryVectorStore(messageString, 5) // Get more results since we have more data types
      console.log(`Found ${relevantData.length} relevant items`)
    } catch (error) {
      console.log("Vector store query failed:", error)
      // Continue without vector store data if it fails
    }

    // Build context from relevant data
    let dndContext = ""
    if (relevantData.length > 0) {
      dndContext = "\n\n## 📚 **Relevant D&D 5e Information**\n"
      
      // Group by type for better organization
      const groupedByType = relevantData.reduce((acc, item) => {
        const type = item.metadata.type
        if (!acc[type]) acc[type] = []
        acc[type].push(item)
        return acc
      }, {} as Record<string, ScoredVectorItem[]>)
      
      Object.entries(groupedByType).forEach(([type, items]) => {
        dndContext += `\n**${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}:**\n`
        items.forEach((item) => {
          dndContext += `• **${item.metadata.name}** (${(item.score * 100).toFixed(1)}% relevant): ${item.text}\n`
        })
      })
      
      dndContext += "\n---\n"
    }

    // Prepare the system prompt for character creation
    const systemPrompt = `You are a helpful D&D 5e character creation assistant. Your role is to guide the user step by step through creating a unique character.

**Session ID:** ${sessionId}  
**User:** ${session.user?.email || 'Unknown'}

${dndContext}

---

## 📜 **Guidelines**

- Be friendly, encouraging, and patient.
- Ask **one clear question at a time** to avoid overwhelming the user.
- Cover: race, class, background, ability scores, proficiencies, equipment, spells, and features.
- Provide **BRIEF explanations** for options when needed.
- Keep responses **concise, clear, and easy to read**.
- If the user seems confused, offer to clarify or break things down further.
- This is a **guided conversation**, not a form. Respond naturally.
- **Remember** the user's choices and build on them.
- Be flexible — if the user wants to change a previous choice, help them.
- Stay focused on **character creation only**.
---

## ⚠️ **CRITICAL BEHAVIORS**

- **NEVER** make decisions for the user.
- **ALWAYS** present clear options and ask the user to choose.
- For proficiencies, equipment, spells, and features:
  - **NEVER** assign them automatically.
  - **ALWAYS** present choices as **questions** with clear options.
- **NEVER** invent new rules — stick to D&D 5e rules and official content.

---

## ✅ **Response Format**

- Use **bold** for key terms and choices.
- Use *italics* for emphasis and brief descriptions.
- Use • for bullet lists of options.
- Use numbered lists for step-by-step instructions.
- Use > for tips and important notes.
- Keep paragraphs short.

---

## 📦 **Structured Output**

✅ You MUST respond with:
1️⃣ A clear conversational response the user will see.
2️⃣ Also include the same structured JSON as HIDDEN (unprinted) metadata (not in the visible text).

Never display the raw JSON directly in your visible reply.

**Example:**

\`\`\`
{
  "response": {
    "message": "Your friendly response here.",
    "type": "question|information|confirmation|completion",
    "options": ["option1", "option2"],
    "character": {
      "name": "string or null",
      "race": "string or null",
      "class": "string or null",
      "background": "string or null",
      "level": 1,
      "abilityScores": {
        "str": null,
        "dex": null,
        "con": null,
        "int": null,
        "wis": null,
        "cha": null
      },
      "hp": null,
      "ac": null,
      "initiative": null,
      "proficiencies": [],
      "equipment": [],
      "spells": [],
      "features": [],
      "isComplete": false
    }
  }
}
\`\`\`

**Response Types:**  
- **question** — Asking the user to make a choice  
- **information** — Explaining an option or concept  
- **confirmation** — Confirming what the user chose  
- **completion** — Character creation is complete

---

## 🎲 **Specific Guidance**

- **Proficiencies:** Present all options. Ask which the user wants.
- **Equipment:** Show all starting gear choices. Let the user pick.
- **Spells:** For spellcasters, present known spells to choose from.
- **Features:** Explain class/background features. Confirm choices.
- **Ability Scores:** Help assign rolled or point-buy scores.
- **Background:** Explain background benefits. Let the user pick.

---

## 🗝️ **Example Approach**

**WRONG:**  
> *"I've given you proficiency in Athletics and Intimidation."*

**RIGHT:**  
> *"As a Fighter, you can choose two skills from: Athletics, Acrobatics, History, Insight, Intimidation, Perception, and Survival. Which two would you like?"*

---

Begin by warmly asking what kind of character the user wants to create. Guide them step by step.
`

    console.log("System prompt length:", systemPrompt.length)

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: "system", content: systemPrompt }
    ]

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      console.log("Adding conversation history:", conversationHistory.length, "messages")
      messages.push(...conversationHistory)
    } else {
      console.log("No conversation history, adding current message only")
      // Fallback to just the current message if no history
      messages.push({ role: "user", content: messageString })
    }

    console.log("Total messages to send:", messages.length)
    console.log("Messages structure:", messages.map(m => ({ role: m.role, contentLength: m.content.length })))

    const requestBody = {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1500
      }
    }
    console.log("Ollama request body:", JSON.stringify(requestBody, null, 2))

    // Make request to Ollama
    console.log("Making request to Ollama...")
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })

    // Always stream Ollama's response directly to the client
    if (!ollamaResponse.body) {
      return NextResponse.json({ success: false, error: "No response body from Ollama" }, { status: 500 })
    }
    // Forward the stream as text/plain for browser streaming compatibility
    return new NextResponse(ollamaResponse.body, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      }
    })

  } catch (error) {
    console.error("Chat API error:", error)
    console.log("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    console.log("=== CHAT API CALL ERROR ===")
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

