import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
  })
  if (existingUser) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 })
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })
  return NextResponse.json({ user: { id: user.id, email: user.email } })
} 