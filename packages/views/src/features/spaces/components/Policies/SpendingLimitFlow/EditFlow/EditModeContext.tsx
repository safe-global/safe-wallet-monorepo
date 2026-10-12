import { createContext, useContext, type ReactElement, type ReactNode } from 'react'

const EditModeContext = createContext(false)

/** False everywhere the provider is absent, so the create flow and the stories keep their behaviour. */
export const useIsEditMode = (): boolean => useContext(EditModeContext)

export const EditModeProvider = ({ children }: { children: ReactNode }): ReactElement => (
  <EditModeContext.Provider value={true}>{children}</EditModeContext.Provider>
)
