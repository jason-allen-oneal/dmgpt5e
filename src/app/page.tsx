"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const { session, isAuthenticated, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [registerError, setRegisterError] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value })
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value })
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)
    
    const res = await signIn("credentials", {
      email: loginForm.email,
      password: loginForm.password,
      redirect: false,
    })
    
    setLoginLoading(false)
    if (res?.error) {
      setLoginError("Invalid email or password.")
      return
    }
    
    // Redirect to dashboard on successful login
    router.push("/dashboard")
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError("")
    
    if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      setRegisterError("All fields are required.")
      return
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Passwords do not match.")
      return
    }
    
    setRegisterLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: registerForm.email,
        password: registerForm.password,
      }),
    })
    
    setRegisterLoading(false)
    const data = await res.json()
    
    if (!res.ok) {
      setRegisterError(data.error || "Registration failed.")
      return
    }
    
    // Switch to login tab after successful registration
    setActiveTab("login")
    setLoginForm({ email: registerForm.email, password: "" })
    setRegisterForm({ email: "", password: "", confirmPassword: "" })
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="w-96 bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome!</h2>
            <div className="space-y-4 mb-8">
              <p className="text-gray-700">
                You are signed in as: <span className="font-semibold text-gray-900">{session?.user?.email}</span>
              </p>
              {session?.user?.name && (
                <p className="text-gray-700">
                  Name: <span className="font-semibold text-gray-900">{session.user.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-96 bg-white rounded-xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Authentication</h2>
        
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
              activeTab === "login" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
              activeTab === "register" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={handleLoginChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={handleLoginChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {loginError}
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        )}

        {/* Registration Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {registerError}
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={registerLoading}
            >
              {registerLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                "Register"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}