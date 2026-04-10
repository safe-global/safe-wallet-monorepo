import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface SectionVisibilityContextValue {
  reportVisibility: (id: string, visible: boolean) => void
  hasVisibleSections: boolean
}

const SectionVisibilityContext = createContext<SectionVisibilityContextValue>({
  reportVisibility: () => {},
  hasVisibleSections: true,
})

export const useSectionVisibility = () => useContext(SectionVisibilityContext)

export const SectionVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})

  const reportVisibility = useCallback((id: string, visible: boolean) => {
    setVisibleSections((prev) => (prev[id] === visible ? prev : { ...prev, [id]: visible }))
  }, [])

  const hasVisibleSections = Object.values(visibleSections).some(Boolean)

  return (
    <SectionVisibilityContext.Provider value={{ reportVisibility, hasVisibleSections }}>
      {children}
    </SectionVisibilityContext.Provider>
  )
}
