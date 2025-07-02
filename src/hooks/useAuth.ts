"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    signIn,
    signOut,
  }
} 