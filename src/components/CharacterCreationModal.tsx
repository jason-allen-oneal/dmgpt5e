"use client"

import { useEffect, useState, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { CharacterCreationResponseSchema } from "@/lib/schemas/characterCreationResponse"

interface StructuredResponse {
  message: string
  type: "question" | "information" | "confirmation" | "completion"
  options?: string[]
  nextStep?: string
  character: {
    name: string | null
    race: string | null
    class: string | null
    background: string | null
    level: number
    abilityScores: {
      str: number | null
      dex: number | null
      con: number | null
      int: number | null
      wis: number | null
      cha: number | null
    }
    hp?: number | null
    ac?: number | null
    initiative?: number | null
    proficiencies: string[]
    equipment: string[]
    spells: string[]
    features: string[]
    isComplete: boolean
  }
}

interface Character {
  id: string
  name: string
  race: string
  class: string
  background?: string
  level: number
  abilityScores: {
    str: number | null
    dex: number | null
    con: number | null
    int: number | null
    wis: number | null
    cha: number | null
  }
  hp?: number | null
  ac?: number | null
  initiative?: number | null
  proficiencies: string[]
  equipment: string[]
  spells: string[]
  features: string[]
  createdAt: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  structuredData?: StructuredResponse
}

interface CharacterCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCharacterCreated?: (character: Character) => void
}

export default function CharacterCreationModal({ isOpen, onClose, onCharacterCreated }: CharacterCreationModalProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [characterData, setCharacterData] = useState<StructuredResponse['character'] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [completedCharacter, setCompletedCharacter] = useState<Character | null>(null)
  
  // Ref for auto-scrolling chat
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Initialize character creation when modal opens
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      // Generate unique session ID for this character creation session
      const newSessionId = `character-creation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      setCharacterData(null)
      initializeCharacterCreation(newSessionId)
    }
  }, [isOpen, chatMessages.length])

  const saveCharacter = async (character: Character) => {
    console.log("=== SAVE CHARACTER ===")
    console.log("Character to save:", character)
    setIsSaving(true)
    try {
      console.log("Sending POST request to /api/characters")
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(character),
      })
      
      console.log("Save response status:", response.status)
      if (response.ok) {
        const savedCharacter = await response.json()
        console.log("Character saved successfully:", savedCharacter)
        onCharacterCreated?.(savedCharacter)
        setShowCompletionDialog(false)
        setCompletedCharacter(null)
        handleClose()
      } else {
        console.error("Failed to save character")
        const errorData = await response.text()
        console.log("Error response:", errorData)
      }
    } catch (error) {
      console.error("Error saving character:", error)
      console.log("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsSaving(false)
      console.log("=== SAVE CHARACTER END ===")
    }
  }

  const handleConfirmSave = () => {
    if (completedCharacter) {
      saveCharacter(completedCharacter)
    }
  }

  const handleCancelSave = () => {
    setShowCompletionDialog(false)
    setCompletedCharacter(null)
  }

  const initializeCharacterCreation = async (sessionId: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/characters/creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hello! I want to create a new D&D 5e character. Please guide me through the character creation process step by step. Start by asking me what kind of character I'd like to create.",
          sessionId: sessionId,
          context: "Character creation session"
        }),
      })
      const raw = await response.text()
      console.log("LM STUDIO RAW RESPONSE:", raw)
      const data = JSON.parse(raw)
      if (!data.success) {
        setChatMessages([{
          role: "assistant",
          content: data.error || "Sorry, there was an error initializing character creation.",
          timestamp: new Date()
        }])
        return
      }
      // Handle tool response
      if (data.tool === "dice_roll") {
        setChatMessages([{
          role: "assistant",
          content: `🎲 Rolled ${data.dice}: ${data.rolls.join(", ")}`,
          timestamp: new Date()
        }])
        return
      }
      const structuredData = data.response
      let assistantMessage: ChatMessage = {
        role: "assistant",
        content: structuredData.message,
        timestamp: new Date(),
        structuredData
      }
      setChatMessages([assistantMessage])
      if (structuredData.character) {
        setCharacterData(structuredData.character)
        if (structuredData.character.isComplete) {
          const characterToSave: Character = {
            id: "",
            name: structuredData.character.name || "",
            race: structuredData.character.race || "",
            class: structuredData.character.class || "",
            background: structuredData.character.background ?? undefined,
            level: structuredData.character.level,
            abilityScores: structuredData.character.abilityScores,
            hp: structuredData.character.hp,
            ac: structuredData.character.ac,
            initiative: structuredData.character.initiative,
            proficiencies: structuredData.character.proficiencies,
            equipment: structuredData.character.equipment,
            spells: structuredData.character.spells,
            features: structuredData.character.features,
            createdAt: new Date().toISOString()
          }
          setCompletedCharacter(characterToSave)
          setShowCompletionDialog(true)
        }
      }
    } catch (err) {
      setChatMessages([{
        role: "assistant",
        content: "Hello! I'm here to help you create a D&D 5e character. What kind of character would you like to create?",
        timestamp: new Date()
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return

    const userMessage = currentMessage
    setCurrentMessage("")
    
    await processMessage(userMessage)
  }

  const processMessage = async (userMessage: string) => {
    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, newUserMessage])
    setIsGenerating(true)
    try {
      const conversationHistory = [...chatMessages, newUserMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      const response = await fetch("/api/characters/creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory,
          sessionId: sessionId,
          context: "Character creation session"
        }),
      })
      const raw = await response.text()
      console.log("LM STUDIO RAW RESPONSE:", raw)
      const data = JSON.parse(raw)
      if (!data.success) {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: data.error || "Sorry, there was an error processing your request. Please try again.",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMessage])
        return
      }
      // Handle tool response
      if (data.tool === "dice_roll") {
        const toolMessage: ChatMessage = {
          role: "assistant",
          content: `🎲 Rolled ${data.dice}: ${data.rolls.join(", ")}`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, toolMessage])
        return
      }
      const structuredData = data.response
      let assistantMessage: ChatMessage = {
        role: "assistant",
        content: structuredData.message,
        timestamp: new Date(),
        structuredData
      }
      setChatMessages(prev => [...prev, assistantMessage])
      if (structuredData.character) {
        setCharacterData(structuredData.character)
        if (structuredData.character.isComplete) {
          const characterToSave: Character = {
            id: "",
            name: structuredData.character.name || "",
            race: structuredData.character.race || "",
            class: structuredData.character.class || "",
            background: structuredData.character.background ?? undefined,
            level: structuredData.character.level,
            abilityScores: structuredData.character.abilityScores,
            hp: structuredData.character.hp,
            ac: structuredData.character.ac,
            initiative: structuredData.character.initiative,
            proficiencies: structuredData.character.proficiencies,
            equipment: structuredData.character.equipment,
            spells: structuredData.character.spells,
            features: structuredData.character.features,
            createdAt: new Date().toISOString()
          }
          setCompletedCharacter(characterToSave)
          setShowCompletionDialog(true)
        }
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setChatMessages([])
    setCurrentMessage("")
    setSessionId("")
    setCharacterData(null)
    onClose()
  }

  const getAbilityScoreDisplayWithModifier = (score: number | null) => {
    if (score === null) return "—"
    const modifier = Math.floor((score - 10) / 2)
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`
    return `${score} (${modifierStr})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Your Character</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Character Progress (if data exists) */}
        {characterData && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                {characterData.name && (
                  <span className="font-semibold text-blue-900">{characterData.name}</span>
                )}
                {characterData.race && (
                  <span className="text-blue-700">{characterData.race}</span>
                )}
                {characterData.class && (
                  <span className="text-blue-700">{characterData.class}</span>
                )}
                {characterData.background && (
                  <span className="text-blue-700">{characterData.background}</span>
                )}
              </div>
              {characterData.name && characterData.race && characterData.class && (
                <span className="text-green-600 font-semibold">✓ Complete</span>
              )}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-900"
              }`}>
                {message.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        // Custom styling for markdown elements
                        h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-3 italic bg-blue-50 py-1 rounded-r">{children}</blockquote>,
                        code: ({children}) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    
                    {/* Show options if available */}
                    {message.structuredData?.options && message.structuredData.options.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Quick options:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.structuredData.options.map((option, optionIndex) => (
                            <button
                              key={optionIndex}
                              onClick={() => processMessage(option)}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show next step if available */}
                    {message.structuredData?.nextStep && (
                      <div className="mt-2 text-xs text-gray-500 italic">
                        Next: {message.structuredData.nextStep}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your response..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              disabled={isGenerating || isSaving}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isGenerating || isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Confirmation Dialog */}
      {showCompletionDialog && completedCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900">Character Creation Complete!</h2>
              <p className="text-gray-600 mt-2 text-lg">Review your character before saving:</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Character Header */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 border border-blue-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                      {completedCharacter.name || "Unnamed Character"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-lg">
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                        {completedCharacter.race}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-semibold">
                        {completedCharacter.class}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold">
                        Level {completedCharacter.level}
                      </span>
                    </div>
                    {completedCharacter.background && (
                      <p className="text-gray-700 mt-4 text-lg font-medium italic">&ldquo;{completedCharacter.background}&rdquo;</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Combat Stats */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Combat Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-100">
                      <span className="text-gray-700 font-semibold">Hit Points:</span>
                      <span className="text-2xl font-bold text-red-600">{completedCharacter.hp || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-100">
                      <span className="text-gray-700 font-semibold">Armor Class:</span>
                      <span className="text-2xl font-bold text-red-600">{completedCharacter.ac || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-100">
                      <span className="text-gray-700 font-semibold">Initiative:</span>
                      <span className="text-2xl font-bold text-red-600">{completedCharacter.initiative || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Ability Scores */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Ability Scores
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">STR</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAbilityScoreDisplayWithModifier(completedCharacter.abilityScores.str)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">DEX</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAbilityScoreDisplayWithModifier(completedCharacter.abilityScores.dex)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">CON</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAbilityScoreDisplayWithModifier(completedCharacter.abilityScores.con)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">INT</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAbilityScoreDisplayWithModifier(completedCharacter.abilityScores.int)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">WIS</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAbilityScoreDisplayWithModifier(completedCharacter.abilityScores.wis)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">CHA</div>
                      <div className="text-xl font-bold text-green-600">
                        {getAbilityScoreDisplayWithModifier(completedCharacter.abilityScores.cha)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Character Info */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Character Info
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-blue-100 p-4">
                      <div className="text-sm text-gray-500 font-medium mb-1">Class</div>
                      <div className="text-lg font-bold text-blue-600">{completedCharacter.class}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-blue-100 p-4">
                      <div className="text-sm text-gray-500 font-medium mb-1">Race</div>
                      <div className="text-lg font-bold text-blue-600">{completedCharacter.race}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-blue-100 p-4">
                      <div className="text-sm text-gray-500 font-medium mb-1">Level</div>
                      <div className="text-lg font-bold text-blue-600">{completedCharacter.level}</div>
                    </div>
                    {completedCharacter.background && (
                      <div className="bg-white rounded-lg border border-blue-100 p-4">
                        <div className="text-sm text-gray-500 font-medium mb-1">Background</div>
                        <div className="text-lg font-bold text-blue-600">{completedCharacter.background}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Proficiencies, Equipment, Spells, and Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Proficiencies */}
                {completedCharacter.proficiencies.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Proficiencies
                    </h3>
                    <div className="bg-white rounded-lg border border-yellow-200 p-4 max-h-48 overflow-y-auto">
                      <div className="flex flex-wrap gap-3">
                        {completedCharacter.proficiencies.map((prof, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-200 shadow-sm">
                            {prof}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {completedCharacter.equipment.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Equipment
                    </h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {completedCharacter.equipment.map((item, index) => (
                          <li key={index} className="text-gray-700 font-medium flex items-start">
                            <span className="text-gray-400 mr-2 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Spells */}
                {completedCharacter.spells.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Spells
                    </h3>
                    <div className="bg-white rounded-lg border border-purple-200 p-4 max-h-48 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {completedCharacter.spells.map((spell, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-semibold border border-purple-200">
                            {spell}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                {completedCharacter.features.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Features
                    </h3>
                    <div className="bg-white rounded-lg border border-teal-200 p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {completedCharacter.features.map((feature, index) => (
                          <li key={index} className="text-gray-700 font-medium flex items-start">
                            <span className="text-teal-400 mr-2 mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Warning Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-lg font-semibold text-yellow-800 mb-2">Ready to Save?</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Your character &quot;{completedCharacter.name}&quot; has been created successfully! You can now join campaigns or create more characters.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={handleCancelSave}
                disabled={isSaving}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isSaving ? "Saving..." : "Save Character"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 