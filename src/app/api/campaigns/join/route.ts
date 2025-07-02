import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  console.log("=== JOIN CAMPAIGN API ===")
  console.log("Timestamp:", new Date().toISOString())
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("Session check:", session ? "Authenticated" : "No session")
    if (!session?.user?.email) {
      console.log("Authentication failed - returning 401")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { campaignId, characterId } = await request.json()
    console.log("Join request data:", { campaignId, characterId })

    if (!campaignId) {
      console.log("Missing campaign ID")
      return NextResponse.json({ 
        success: false, 
        error: "Campaign ID is required" 
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

    // Check if campaign exists and get its details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          include: {
            character: true
          }
        }
      }
    })

    if (!campaign) {
      console.log("Campaign not found")
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = campaign.members.find(member => member.userId === user.id)
    if (existingMember) {
      console.log("User already a member of this campaign")
      return NextResponse.json({ success: false, error: "Already a member of this campaign" }, { status: 400 })
    }

    // Check if campaign is full
    if (campaign.members.length >= campaign.maxPlayers) {
      console.log("Campaign is full")
      return NextResponse.json({ success: false, error: "Campaign is full" }, { status: 400 })
    }

    // If characterId is provided, validate it
    if (characterId) {
      const character = await prisma.character.findUnique({
        where: { id: characterId }
      })

      if (!character) {
        console.log("Character not found")
        return NextResponse.json({ success: false, error: "Character not found" }, { status: 404 })
      }

      if (character.userId !== user.id) {
        console.log("Character doesn't belong to user")
        return NextResponse.json({ success: false, error: "Character doesn't belong to you" }, { status: 403 })
      }

      // Check character level requirements
      if (character.level < campaign.minLevel || character.level > campaign.maxLevel) {
        console.log("Character level doesn't meet requirements")
        return NextResponse.json({ 
          success: false, 
          error: `Character level must be between ${campaign.minLevel} and ${campaign.maxLevel}` 
        }, { status: 400 })
      }

      // Check if character is already in another campaign
      const characterInCampaign = await prisma.campaignMember.findUnique({
        where: { characterId: characterId }
      })

      if (characterInCampaign) {
        console.log("Character already in another campaign")
        return NextResponse.json({ success: false, error: "Character is already in another campaign" }, { status: 400 })
      }
    }

    // Add user to campaign
    console.log("Adding user to campaign...")
    await prisma.campaignMember.create({
      data: {
        campaignId: campaignId,
        userId: user.id,
        characterId: characterId || null
      }
    })

    console.log("User successfully joined campaign")
    console.log("=== JOIN CAMPAIGN API END ===")

    return NextResponse.json({
      success: true,
      message: "Successfully joined campaign"
    })

  } catch (error) {
    console.error("Error joining campaign:", error)
    console.log("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    })
    console.log("=== JOIN CAMPAIGN API ERROR ===")
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 