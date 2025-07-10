import React, { createContext, useContext, useState, ReactNode } from 'react'

interface GuardContextType {
  guards: Record<string, boolean>
  setGuard: (guardType: string, value: boolean) => void
  getGuard: (guardType: string) => boolean
  resetGuard: (guardType: string) => void
  resetAllGuards: () => void
}

const GuardContext = createContext<GuardContextType | undefined>(undefined)

export const useGuard = () => {
  const context = useContext(GuardContext)
  if (!context) {
    throw new Error('useGuard must be used within a GuardProvider')
  }
  return context
}

interface GuardProviderProps {
  children: ReactNode
}

export const GuardProvider: React.FC<GuardProviderProps> = ({ children }) => {
  const [guards, setGuards] = useState<Record<string, boolean>>({})

  const setGuard = (guardType: string, value: boolean) => {
    setGuards((prev) => ({ ...prev, [guardType]: value }))
  }

  const getGuard = (guardType: string) => {
    return guards[guardType] || false
  }

  const resetGuard = (guardType: string) => {
    setGuards((prev) => ({ ...prev, [guardType]: false }))
  }

  const resetAllGuards = () => {
    setGuards({})
  }

  return (
    <GuardContext.Provider value={{ guards, setGuard, getGuard, resetGuard, resetAllGuards }}>
      {children}
    </GuardContext.Provider>
  )
}
