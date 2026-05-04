import React, { createContext, useContext, useState, useCallback } from 'react'
import { ExtractedPasskeyData } from '@safe-global/protocol-kit'

interface PasskeySetupState {
  credential: ExtractedPasskeyData | null
  rawId: string | null
  name: string
  identityAddress: string | null
  error: string | null
}

interface PasskeySetupContextValue extends PasskeySetupState {
  setCredential: (credential: ExtractedPasskeyData, rawId: string) => void
  setName: (name: string) => void
  setIdentityAddress: (address: string) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: PasskeySetupState = {
  credential: null,
  rawId: null,
  name: 'My iPhone Passkey',
  identityAddress: null,
  error: null,
}

const PasskeySetupContext = createContext<PasskeySetupContextValue | null>(null)

export function PasskeySetupProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PasskeySetupState>(initialState)

  const setCredential = useCallback((credential: ExtractedPasskeyData, rawId: string) => {
    setState((prev) => ({ ...prev, credential, rawId }))
  }, [])

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }))
  }, [])

  const setIdentityAddress = useCallback((address: string) => {
    setState((prev) => ({ ...prev, identityAddress: address }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return (
    <PasskeySetupContext.Provider
      value={{
        ...state,
        setCredential,
        setName,
        setIdentityAddress,
        setError,
        reset,
      }}
    >
      {children}
    </PasskeySetupContext.Provider>
  )
}

export function usePasskeySetup(): PasskeySetupContextValue {
  const context = useContext(PasskeySetupContext)
  if (!context) {
    throw new Error('usePasskeySetup must be used within PasskeySetupProvider')
  }
  return context
}
