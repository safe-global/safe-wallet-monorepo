import type { ReactElement, ReactNode } from 'react'
import { createContext, useState } from 'react'

export const BatchExecuteHoverContext = createContext<{
  activeHover: string[]
  setActiveHover: (activeHover: string[]) => void
}>({
  activeHover: [],
  setActiveHover: () => {},
})

// Used for highlighting transactions that will be included when executing them as a batch
export const BatchExecuteHoverProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [activeHover, setActiveHover] = useState<string[]>([])

  return (
    <BatchExecuteHoverContext.Provider value={{ activeHover, setActiveHover }}>
      {children}
    </BatchExecuteHoverContext.Provider>
  )
}
