import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  console.log("=== CAMPAIGNS API POST ===")
  console.log("Timestamp:", new Date().toISOString())
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("Session check:", session ? "Authenticated" : "No session")
    if (!session?.user?.email) {
      console.log("Authentication failed - returning 401")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const campaignData = await request.json()
    console.log("Campaign data received:", campaignData)

    // Validate required fields
    if (!campaignData.name) {
      console.log("Missing campaign name")
      return NextResponse.json({ 
        success: false, 
        error: "Campaign name is required" 
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

    // Create campaign
    console.log("Creating campaign...")
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignData.name,
        description: campaignData.description,
        isPrivate: campaignData.isPrivate || false,
        minLevel: campaignData.minLevel || 1,
        maxLevel: campaignData.maxLevel || 20,
        maxPlayers: campaignData.maxPlayers || 6,
        createdBy: user.id
      }
    })

    // Add creator as first member
    await prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        userId: user.id
      }
    })

    console.log("Campaign created successfully:", campaign.id)
    console.log("=== CAMPAIGNS API POST END ===")

    return NextResponse.json({
      success: true,
      campaign: campaign
    })

  } catch (error) {
    console.error("Error creating campaign:", error)
    console.log("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    })
    console.log("=== CAMPAIGNS API POST ERROR ===")
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET() {
  console.log("=== CAMPAIGNS API GET ===")
  console.log("Timestamp:", new Date().toISOString())
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log("Session check:", session ? "Authenticated" : "No session")
    if (!session?.user?.email) {
      console.log("Authentication failed - returning 401")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
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

    // Get campaigns the user can join (public campaigns they're not already in)
    const availableCampaigns = await prisma.campaign.findMany({
      where: {
        AND: [
          { isPrivate: false },
          {
            members: {
              none: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get campaigns the user is already in
    const userCampaigns = await prisma.campaign.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            character: {
              select: {
                name: true,
                level: true,
                class: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log("Available campaigns:", availableCampaigns.length)
    console.log("User campaigns:", userCampaigns.length)
    console.log("=== CAMPAIGNS API GET END ===")

    return NextResponse.json({
      success: true,
      availableCampaigns: availableCampaigns,
      userCampaigns: userCampaigns
    })

  } catch (error) {
    console.error("Error fetching campaigns:", error)
    console.log("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    })
    console.log("=== CAMPAIGNS API GET ERROR ===")
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 