import { useState, useEffect } from 'react'

/**
 * Custom hook for safe client-side storage access
 * Prevents hydration errors by ensuring storage is only accessed after mount
 */
export function useClientSideStorage<T>(
  key: string,
  initialValue: T,
  storage: Storage | null = null
): [T, (value: T) => void, boolean] {
  // State to track if component is mounted (client-side)
  const [mounted, setMounted] = useState(false)
  
  // Initialize with the initial value (same on server and client)
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Set mounted flag after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load from storage after mounting
  useEffect(() => {
    if (!mounted) return
    
    try {
      // Use localStorage by default, or the provided storage
      const storageObj = storage || (typeof window !== 'undefined' ? window.localStorage : null)
      if (!storageObj) return

      const item = storageObj.getItem(key)
      if (item) {
        const parsed = JSON.parse(item) as T
        setStoredValue(parsed)
      }
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error)
    }
  }, [mounted, key, storage])

  // Save to storage whenever value changes (after mount)
  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      
      if (!mounted) return
      
      const storageObj = storage || (typeof window !== 'undefined' ? window.localStorage : null)
      if (!storageObj) return

      if (value === null || value === undefined) {
        storageObj.removeItem(key)
      } else {
        storageObj.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error)
    }
  }

  return [storedValue, setValue, mounted]
}

/**
 * Hook specifically for localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, boolean] {
  return useClientSideStorage(key, initialValue, typeof window !== 'undefined' ? window.localStorage : null)
}

/**
 * Hook specifically for sessionStorage
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, boolean] {
  return useClientSideStorage(key, initialValue, typeof window !== 'undefined' ? window.sessionStorage : null)
}