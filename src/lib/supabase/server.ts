// TEMPORARILY DISABLED - Supabase server client disabled during migration to Medusa
// This file is kept as a stub to prevent import errors during migration

export function createClient() {
  // Return a mock client during migration
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: new Error('Auth disabled') }),
      signOut: () => Promise.resolve({ error: null })
    }
  }
}