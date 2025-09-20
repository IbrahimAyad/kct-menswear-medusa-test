// Medusa authentication integration
import { useRouter } from 'next/navigation'
import { useMedusaAuth } from '@/contexts/MedusaAuthContext'

export function useAuth() {
  const router = useRouter()
  const { user, login, register, logout: medusaLogout, isLoading, error } = useMedusaAuth()

  const signIn = async (email: string, password: string) => {
    try {
      await login(email, password)
      // Redirect to profile page after successful login
      router.push('/profile')
      return { error: null }
    } catch (err: any) {
      return { error: { message: err.message || 'Login failed' } }
    }
  }

  const signUp = async (email: string, password: string, profile?: any) => {
    try {
      await register({
        email,
        password,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      })
      // Redirect to profile page after successful registration
      router.push('/profile')
      return { error: null }
    } catch (err: any) {
      return { error: { message: err.message || 'Registration failed' } }
    }
  }

  const signOut = async () => {
    medusaLogout()
    router.push('/')
  }

  return {
    isAuthenticated: !!user,
    profile: user,
    signIn,
    signUp,
    signOut,
    isLoading,
    error
  }
}