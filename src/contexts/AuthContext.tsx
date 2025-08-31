'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { medusa } from '@/lib/medusa/client'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  has_account: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('medusa_auth_token')
    if (token) {
      refreshUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('medusa_auth_token')
      const userEmail = localStorage.getItem('medusa_user_email')
      
      if (!token || !userEmail) {
        setUser(null)
        setIsLoading(false)
        return
      }

      // For now, just use the stored email as user info
      // The backend customer endpoint seems to have issues
      setUser({
        id: 'customer',
        email: userEmail,
        has_account: true,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to fetch user:', error)
      // Token might be invalid, clear it
      localStorage.removeItem('medusa_auth_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Use Medusa SDK for authentication
      const token = await medusa.auth.login('customer', 'emailpass', {
        email,
        password
      })

      // Verify token is a string
      if (typeof token !== 'string') {
        throw new Error('Authentication failed')
      }

      // Store token
      localStorage.setItem('medusa_auth_token', token)
      
      // Retrieve customer details
      try {
        const { customer } = await medusa.store.customer.retrieve({
          fields: '+email,+first_name,+last_name,+phone'
        })
        setUser({
          id: customer.id,
          email: customer.email || email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone: customer.phone,
          has_account: true,
          created_at: customer.created_at
        })
      } catch (error) {
        // If customer retrieve fails, set basic user info
        setUser({
          id: 'customer',
          email: email,
          has_account: true,
          created_at: new Date().toISOString()
        })
      }
      
      // Refresh cart to link it to the user
      const cartId = localStorage.getItem('medusa_cart_id')
      if (cartId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'}/store/carts/${cartId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          })
        } catch (error) {
          console.error('Failed to link cart to user:', error)
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      throw new Error(error?.message || 'Invalid email or password')
    }
  }

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      // Register using Medusa SDK
      const token = await medusa.auth.register('customer', 'emailpass', {
        email,
        password
      })

      if (typeof token !== 'string') {
        throw new Error('Registration failed')
      }

      // Create customer profile
      try {
        const { customer } = await medusa.store.customer.create({
          email,
          first_name: firstName,
          last_name: lastName
        })
      } catch (error) {
        // Customer might already be created during registration
        console.log('Customer profile might already exist')
      }

      // Store token - user is immediately logged in
      localStorage.setItem('medusa_auth_token', token)
      
      // Retrieve customer details
      try {
        const { customer } = await medusa.store.customer.retrieve({
          fields: '+email,+first_name,+last_name'
        })
        setUser({
          id: customer.id,
          email: customer.email || email,
          first_name: customer.first_name || firstName,
          last_name: customer.last_name || lastName,
          has_account: true,
          created_at: customer.created_at
        })
      } catch (error) {
        // Fallback to provided data
        setUser({
          id: 'customer',
          email: email,
          first_name: firstName,
          last_name: lastName,
          has_account: true,
          created_at: new Date().toISOString()
        })
      }
      
      // No email confirmation needed!
    } catch (error: any) {
      console.error('Registration failed:', error)
      if (error?.message?.includes('already exists')) {
        throw new Error('An account with this email already exists')
      }
      throw new Error(error?.message || 'Failed to create account')
    }
  }

  const logout = () => {
    localStorage.removeItem('medusa_auth_token')
    localStorage.removeItem('medusa_user_email')
    setUser(null)
    router.push('/')
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem('medusa_auth_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'}/store/customers/me`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const { customer } = await response.json()
      setUser(customer as User)
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      throw new Error(error?.message || 'Failed to update profile')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}