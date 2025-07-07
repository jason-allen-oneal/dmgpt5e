import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/ollama"
import { getCharacterCreationPrompt } from "@/lib/prompts/creation"
import { CharacterCreationResponseSchema } from "@/lib/schemas/characterCreationResponse"
import { zodToJsonSchema } from "zod-to-json-schema"
import { getDiceRollTool, rollDice } from "@/lib/tools"

// Extend the timeout for this API route to 10 minutes
export const maxDuration = 600

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

    // No vector store integration - using basic context
    let dndContext = ""

    // Prepare the system prompt for character creation
    const systemPrompt = getCharacterCreationPrompt({
      sessionId,
      userEmail: session.user?.email || 'Unknown',
      dndContext
    })

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

    // Convert to Ollama format
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const requestBody = {
      model: OLLAMA_MODEL,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: 0,
        top_p: 0.9,
        num_predict: 1500
      }
    }
    console.log("Ollama request body size:", JSON.stringify(requestBody).length, "characters")
    console.log("Model being used:", OLLAMA_MODEL)
    console.log("Number of messages:", messages.length)

    // Quick health check to ensure Ollama is responding
    try {
      const healthCheck = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { 
        method: "GET",
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      })
      if (!healthCheck.ok) {
        console.error("Ollama health check failed:", healthCheck.status)
        return NextResponse.json({ 
          success: false, 
          error: "Ollama service is not responding properly" 
        }, { status: 503 })
      }
      console.log("Ollama health check passed")
    } catch (healthError) {
      console.error("Ollama health check error:", healthError)
      return NextResponse.json({ 
        success: false, 
        error: "Cannot connect to Ollama service" 
      }, { status: 503 })
    }

    // Make request to Ollama (non-streaming)
    console.log("Making request to Ollama...")
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minute timeout
    
    try {
      const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!ollamaResponse.ok) {
        console.error("Ollama response not ok:", ollamaResponse.status, ollamaResponse.statusText)
        return NextResponse.json({ 
          success: false, 
          error: `Ollama error: ${ollamaResponse.status} ${ollamaResponse.statusText}` 
        }, { status: 500 })
      }
      
      const data = await ollamaResponse.json()
      console.log("Ollama response received successfully")
      console.log("Ollama response data:", JSON.stringify(data, null, 2))
      
      // Ollama format: { message: { content: "...", role: "assistant" } }
      const messageObj = data.message
      if (!messageObj || !messageObj.content) {
        console.error("Invalid Ollama response format:", data)
        return NextResponse.json({ success: false, error: "Invalid response format from Ollama" }, { status: 500 })
      }

      // Parse the response to extract structured JSON data
      const content = messageObj.content
      
      // Try to extract JSON from the response
      let parsedResponse = null
      try {
        // Look for JSON in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.log("Failed to parse JSON from response, using fallback parsing")
      }
      
      // If we successfully parsed JSON, validate it with the schema
      if (parsedResponse) {
        const result = CharacterCreationResponseSchema.safeParse(parsedResponse)
        if (result.success) {
          console.log("Successfully parsed and validated structured response")
          return NextResponse.json({ success: true, response: result.data.response })
        } else {
          console.error("JSON response failed schema validation:", result.error)
        }
      }
      
      // Fallback: Try to extract structured data from text (the old way)
      console.log("Using fallback text parsing")
      
      // Try to extract options from the response
      const options: string[] = []
      const optionMatches = content.match(/\d+\.\s*([^\n]+)/g)
      if (optionMatches) {
        options.push(...optionMatches.map((match: string) => match.replace(/^\d+\.\s*/, '').trim()))
      }
      
      // Try to extract character data from the response
      let characterData = {
        name: null as string | null,
        race: null as string | null,
        class: null as string | null,
        background: null as string | null,
        level: 1,
        abilityScores: {
          str: null as number | null,
          dex: null as number | null,
          con: null as number | null,
          int: null as number | null,
          wis: null as number | null,
          cha: null as number | null,
        },
        hp: null as number | null,
        ac: null as number | null,
        initiative: null as number | null,
        proficiencies: [] as string[],
        equipment: [] as string[],
        spells: [] as string[],
        features: [] as string[],
        isComplete: false,
      }
      
      // Determine response type based on content
      let responseType: "question" | "information" | "confirmation" | "completion" = "information"
      
      if (content.toLowerCase().includes("what") || content.toLowerCase().includes("?")) {
        responseType = "question"
      } else if (content.toLowerCase().includes("complete") || content.toLowerCase().includes("finished")) {
        responseType = "completion"
        characterData.isComplete = true
      } else if (content.toLowerCase().includes("confirm") || content.toLowerCase().includes("correct")) {
        responseType = "confirmation"
      }
      
      // Try to extract character name
      const nameMatch = content.match(/name[:\s]+([A-Za-z\s]+)/i)
      if (nameMatch) {
        characterData.name = nameMatch[1].trim()
      }
      
      // Try to extract race
      const raceMatch = content.match(/race[:\s]+([A-Za-z\s]+)/i)
      if (raceMatch) {
        characterData.race = raceMatch[1].trim()
      }
      
      // Try to extract class
      const classMatch = content.match(/class[:\s]+([A-Za-z\s]+)/i)
      if (classMatch) {
        characterData.class = classMatch[1].trim()
      }
      
      // Try to extract background
      const backgroundMatch = content.match(/background[:\s]+([A-Za-z\s]+)/i)
      if (backgroundMatch) {
        characterData.background = backgroundMatch[1].trim()
      }
      
      // Try to extract ability scores
      const strMatch = content.match(/STR[:\s]*(\d+)/i)
      if (strMatch) characterData.abilityScores.str = parseInt(strMatch[1])
      
      const dexMatch = content.match(/DEX[:\s]*(\d+)/i)
      if (dexMatch) characterData.abilityScores.dex = parseInt(dexMatch[1])
      
      const conMatch = content.match(/CON[:\s]*(\d+)/i)
      if (conMatch) characterData.abilityScores.con = parseInt(conMatch[1])
      
      const intMatch = content.match(/INT[:\s]*(\d+)/i)
      if (intMatch) characterData.abilityScores.int = parseInt(intMatch[1])
      
      const wisMatch = content.match(/WIS[:\s]*(\d+)/i)
      if (wisMatch) characterData.abilityScores.wis = parseInt(wisMatch[1])
      
      const chaMatch = content.match(/CHA[:\s]*(\d+)/i)
      if (chaMatch) characterData.abilityScores.cha = parseInt(chaMatch[1])
      
      // Try to extract HP, AC, Initiative
      const hpMatch = content.match(/HP[:\s]*(\d+)/i)
      if (hpMatch) characterData.hp = parseInt(hpMatch[1])
      
      const acMatch = content.match(/AC[:\s]*(\d+)/i)
      if (acMatch) characterData.ac = parseInt(acMatch[1])
      
      const initMatch = content.match(/initiative[:\s]*([+-]?\d+)/i)
      if (initMatch) characterData.initiative = parseInt(initMatch[1])
      
      const response = {
        message: content,
        type: responseType,
        options: options,
        character: characterData,
      }

      return NextResponse.json({ success: true, response })
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Ollama request timed out after 5 minutes")
        return NextResponse.json({ 
          success: false, 
          error: "Request timed out - Ollama took too long to respond" 
        }, { status: 408 })
      }
      console.error("Fetch error:", fetchError)
      throw fetchError
    }

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

