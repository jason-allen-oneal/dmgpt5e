import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        try {
          const user = await prisma.user.findFirst({
            where: { email: credentials.email },
          }) as { id: string; email: string; name: string | null; password: string } | null
          
          if (!user || !user.password) {
            return null
          }
          
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            return null
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session }) {
      return session
    },
    async jwt({ token }) {
      return token
    },
  },
} 