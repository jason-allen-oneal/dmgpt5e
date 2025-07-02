import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get character
    const character = await prisma.character.findUnique({
      where: { id: params.id }
    })

    if (!character) {
      return NextResponse.json({ success: false, error: "Character not found" }, { status: 404 })
    }

    // Check if character belongs to user
    if (character.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      character: character
    })

  } catch (error) {
    console.error("Error fetching character:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get character
    const character = await prisma.character.findUnique({
      where: { id: params.id }
    })

    if (!character) {
      return NextResponse.json({ success: false, error: "Character not found" }, { status: 404 })
    }

    // Check if character belongs to user
    if (character.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Check if character is in a campaign
    const campaignMember = await prisma.campaignMember.findUnique({
      where: { characterId: params.id }
    })

    if (campaignMember) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete character that is currently in a campaign. Please leave the campaign first." 
      }, { status: 400 })
    }

    // Delete character
    await prisma.character.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: "Character deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting character:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 })
  }
} 