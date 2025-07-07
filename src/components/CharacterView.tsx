"use client"

import { useState } from "react"

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
  description?: string
  createdAt: string
  updatedAt: string
}

interface CharacterViewProps {
  isOpen: boolean
  onClose: () => void
  characterId: string | null
}

export default function CharacterView({ isOpen, onClose, characterId }: CharacterViewProps) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCharacter = async () => {
    if (!characterId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/characters/${characterId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCharacter(data.character)
        } else {
          setError(data.error || "Failed to load character")
        }
      } else {
        setError("Failed to load character")
      }
    } catch (error) {
      console.error("Error loading character:", error)
      setError("Failed to load character")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCharacter(null)
    setError(null)
    onClose()
  }

  const getAbilityModifier = (score: number | null) => {
    if (score === null) return "—"
    const modifier = Math.floor((score - 10) / 2)
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  const getAbilityScoreDisplay = (score: number | null) => {
    if (score === null) return "—"
    return `${score} (${getAbilityModifier(score)})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Character Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-4">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg text-gray-600 font-medium">Loading character...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-red-500 mb-6">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg text-gray-600 mb-6 font-medium">{error}</p>
              <button
                onClick={loadCharacter}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
              >
                Try Again
              </button>
            </div>
          ) : character ? (
            <div className="space-y-8">
              {/* Character Header */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-8 border border-blue-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">{character.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-lg">
                      <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                        {character.race}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-semibold">
                        {character.class}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold">
                        Level {character.level}
                      </span>
                    </div>
                    {character.background && (
                      <p className="text-gray-700 mt-4 text-lg font-medium italic">&quot;{character.background}&quot;</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 font-medium mb-1">Created</div>
                    <div className="text-gray-900 font-semibold text-lg">{new Date(character.createdAt).toLocaleDateString()}</div>
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
                      <span className="text-2xl font-bold text-red-600">{character.hp || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-100">
                      <span className="text-gray-700 font-semibold">Armor Class:</span>
                      <span className="text-2xl font-bold text-red-600">{character.ac || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-100">
                      <span className="text-gray-700 font-semibold">Initiative:</span>
                      <span className="text-2xl font-bold text-red-600">{character.initiative || "—"}</span>
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
                      <div className="text-xl font-bold text-green-600">{getAbilityScoreDisplay(character.abilityScores.str)}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">DEX</div>
                      <div className="text-xl font-bold text-green-600">{getAbilityScoreDisplay(character.abilityScores.dex)}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">CON</div>
                      <div className="text-xl font-bold text-green-600">{getAbilityScoreDisplay(character.abilityScores.con)}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">INT</div>
                      <div className="text-xl font-bold text-green-600">{getAbilityScoreDisplay(character.abilityScores.int)}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">WIS</div>
                      <div className="text-xl font-bold text-green-600">{getAbilityScoreDisplay(character.abilityScores.wis)}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-sm text-gray-600 font-medium mb-1">CHA</div>
                      <div className="text-xl font-bold text-green-600">{getAbilityScoreDisplay(character.abilityScores.cha)}</div>
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
                      <div className="text-lg font-bold text-blue-600">{character.class}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-blue-100 p-4">
                      <div className="text-sm text-gray-500 font-medium mb-1">Race</div>
                      <div className="text-lg font-bold text-blue-600">{character.race}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-blue-100 p-4">
                      <div className="text-sm text-gray-500 font-medium mb-1">Level</div>
                      <div className="text-lg font-bold text-blue-600">{character.level}</div>
                    </div>
                    {character.background && (
                      <div className="bg-white rounded-lg border border-blue-100 p-4">
                        <div className="text-sm text-gray-500 font-medium mb-1">Background</div>
                        <div className="text-lg font-bold text-blue-600">{character.background}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Proficiencies, Equipment, Spells, and Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Proficiencies */}
                {character.proficiencies.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Proficiencies
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {character.proficiencies.map((prof, index) => (
                        <span key={index} className="bg-white text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-200 shadow-sm">
                          {prof}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {character.equipment.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Equipment
                    </h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {character.equipment.map((item, index) => (
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
                {character.spells.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Spells
                    </h3>
                    <div className="bg-white rounded-lg border border-purple-200 p-4 max-h-48 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {character.spells.map((spell, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-semibold border border-purple-200">
                            {spell}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                {character.features.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Features
                    </h3>
                    <div className="bg-white rounded-lg border border-teal-200 p-4 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {character.features.map((feature, index) => (
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

              {/* Description */}
              {character.description && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Description
                  </h3>
                  <div className="bg-white rounded-lg border border-indigo-200 p-6">
                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{character.description}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
} 