"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import CharacterCreationModal from "@/components/CharacterCreationModal"
import CampaignCreationModal from "@/components/CampaignCreationModal"
import CharacterView from "@/components/CharacterView"

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

interface Campaign {
  id: string
  name: string
  description?: string
  isPrivate: boolean
  minLevel: number
  maxLevel: number
  maxPlayers: number
  createdAt: string
  creator: {
    name?: string
    email: string
  }
  members: Array<{
    user: {
      name?: string
      email: string
    }
    character?: {
      name: string
      level: number
      class: string
    }
  }>
}

export default function Dashboard() {
  const { session, isAuthenticated, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([])
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  
  // Modal state
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showCharacterView, setShowCharacterView] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadCharacters()
      loadCampaigns()
    }
  }, [isAuthenticated])

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/characters")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCharacters(data.characters)
        }
      }
    } catch (error) {
      console.error("Error loading characters:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableCampaigns(data.availableCampaigns)
          setUserCampaigns(data.userCampaigns)
        }
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
    }
  }

  const createCharacter = () => {
    setShowCharacterModal(true)
  }

  const createCampaign = () => {
    setShowCampaignModal(true)
  }

  const closeCharacterModal = () => {
    setShowCharacterModal(false)
  }

  const closeCampaignModal = () => {
    setShowCampaignModal(false)
  }

  const handleCharacterCreated = (character: Character) => {
    setCharacters(prev => [character, ...prev])
  }

  const handleCampaignCreated = (campaign: Campaign) => {
    setUserCampaigns(prev => [campaign, ...prev])
    loadCampaigns() // Refresh to update available campaigns
  }

  const viewCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId)
    setShowCharacterView(true)
  }

  const closeCharacterView = () => {
    setShowCharacterView(false)
    setSelectedCharacterId(null)
  }

  const confirmDeleteCharacter = (character: Character) => {
    setCharacterToDelete(character)
    setShowDeleteConfirm(true)
  }

  const cancelDeleteCharacter = () => {
    setShowDeleteConfirm(false)
    setCharacterToDelete(null)
  }

  const deleteCharacter = async () => {
    if (!characterToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/characters/${characterToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCharacters(prev => prev.filter(c => c.id !== characterToDelete.id))
          setShowDeleteConfirm(false)
          setCharacterToDelete(null)
        } else {
          alert(data.error || "Failed to delete character")
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete character")
      }
    } catch (error) {
      console.error("Error deleting character:", error)
      alert("Failed to delete character")
    } finally {
      setDeleting(false)
    }
  }

  const joinCampaign = async (campaignId: string) => {
    try {
      const response = await fetch("/api/campaigns/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ campaignId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          loadCampaigns() // Refresh campaigns
        }
      }
    } catch (error) {
      console.error("Error joining campaign:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-white">
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, <span className="font-semibold">{session?.user?.name || session?.user?.email}</span>
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Characters Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Characters</h2>
              <button
                onClick={createCharacter}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                Create Character
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-gray-500">Loading characters...</span>
                  </div>
                </div>
              ) : characters.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No characters yet</p>
                  <p className="text-gray-400 text-xs">Create your first character to get started</p>
                </div>
              ) : (
                characters.map((character) => (
                  <div key={character.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{character.name}</h3>
                        <p className="text-sm text-gray-600">{character.race} {character.class} • Level {character.level}</p>
                        {character.background && (
                          <p className="text-xs text-gray-500">{character.background}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <span className="text-xs text-gray-400">{new Date(character.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => viewCharacter(character.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View character"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDeleteCharacter(character)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete character"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Campaigns Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Campaigns</h2>
              <button
                onClick={createCampaign}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
              >
                Create Campaign
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-gray-500">Loading campaigns...</span>
                  </div>
                </div>
              ) : userCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No campaigns yet</p>
                  <p className="text-gray-400 text-xs">Create your first campaign to get started</p>
                </div>
              ) : (
                userCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                        <p className="text-xs text-gray-500">Level {campaign.minLevel}-{campaign.maxLevel} • {campaign.members.length}/{campaign.maxPlayers} players</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Campaigns Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Campaigns</h2>
            <div className="space-y-3">
              {availableCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No campaigns available</p>
                  <p className="text-gray-400 text-xs">Check back later for new campaigns</p>
                </div>
              ) : (
                availableCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.description}</p>
                        <p className="text-xs text-gray-500">
                          Level {campaign.minLevel}-{campaign.maxLevel} • {campaign.members.length}/{campaign.maxPlayers} players
                        </p>
                        <p className="text-xs text-gray-500">Created by {campaign.creator.name || campaign.creator.email}</p>
                      </div>
                      <button
                        onClick={() => joinCampaign(campaign.id)}
                        className="ml-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded text-xs transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard!</h2>
          <p className="text-gray-600 mb-4">
            You have successfully logged in to your account. This is your personal dashboard where you can manage your profile, view your information, and access various features.
          </p>
          <p className="text-gray-600">
            Your session is secure and you can sign out at any time using the button in the header or the quick actions panel.
          </p>
        </div>
      </main>

      {/* Character Creation Modal */}
      <CharacterCreationModal 
        isOpen={showCharacterModal} 
        onClose={closeCharacterModal}
        onCharacterCreated={handleCharacterCreated}
      />

      {/* Campaign Creation Modal */}
      <CampaignCreationModal 
        isOpen={showCampaignModal} 
        onClose={closeCampaignModal}
        onCampaignCreated={handleCampaignCreated}
      />

      {/* Character View Modal */}
      <CharacterView 
        isOpen={showCharacterView}
        onClose={closeCharacterView}
        characterId={selectedCharacterId}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && characterToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Character</h2>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete <strong>{characterToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 flex justify-end space-x-3">
              <button
                onClick={cancelDeleteCharacter}
                disabled={deleting}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={deleteCharacter}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {deleting && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 