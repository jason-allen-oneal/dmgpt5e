"use client"

import { useAuth } from "@/hooks/useAuth"

export function AuthButton() {
  const { session, isAuthenticated, isLoading, signIn, signOut } = useAuth()

  if (isLoading) {
    return (
      <button className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed">
        Loading...
      </button>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, {session?.user?.name || session?.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Sign In
    </button>
  )
} 