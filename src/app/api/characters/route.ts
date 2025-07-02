import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  console.log("=== CHARACTERS API POST ===")
  console.log("Timestamp:", new Date().toISOString())
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("Session check:", session ? "Authenticated" : "No session")
    if (!session?.user?.email) {
      console.log("Authentication failed - returning 401")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const characterData = await request.json()
    console.log("Character data received:", characterData)

    // Validate required fields
    if (!characterData.name || !characterData.race || !characterData.class) {
      console.log("Missing required fields:", {
        name: !!characterData.name,
        race: !!characterData.race,
        class: !!characterData.class
      })
      return NextResponse.json({ 
        success: false, 
        error: "Name, race, and class are required" 
      }, { status: 400 })
    }

    // Get user ID
    console.log("Looking up user:", session.user.email)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.log("User not found in database")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    console.log("User found:", user.id)

    // Save character to database
    console.log("Saving character to database...")
    const character = await prisma.character.create({
      data: {
        name: characterData.name,
        race: characterData.race,
        class: characterData.class,
        background: characterData.background,
        level: characterData.level || 1,
        abilityScores: characterData.abilityScores,
        proficiencies: characterData.proficiencies,
        equipment: characterData.equipment,
        spells: characterData.spells,
        features: characterData.features,
        userId: user.id
      }
    })

    console.log("Character saved successfully:", character.id)
    console.log("=== CHARACTERS API POST END ===")

    return NextResponse.json({
      success: true,
      character: character
    })

  } catch (error) {
    console.error("Error saving character:", error)
    console.log("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    })
    console.log("=== CHARACTERS API POST ERROR ===")
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get user's characters
    const characters = await prisma.character.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      characters: characters
    })

  } catch (error) {
    console.error("Error fetching characters:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 