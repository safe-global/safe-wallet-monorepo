import { createContext, useState } from 'react'
import type { Dispatch, ReactElement, SetStateAction } from 'react'

type SubmitError = Error | undefined

export const RecoveryListItemContext = createContext<{
  submitError: SubmitError
  setSubmitError: Dispatch<SetStateAction<SubmitError>>
}>({
  submitError: undefined,
  setSubmitError: () => {},
})

export function RecoveryListItemProvider({ children }: { children: ReactElement }): ReactElement {
  const [submitError, setSubmitError] = useState<SubmitError>(undefined)

  return (
    <RecoveryListItemContext.Provider value={{ submitError, setSubmitError }}>
      {children}
    </RecoveryListItemContext.Provider>
  )
}
