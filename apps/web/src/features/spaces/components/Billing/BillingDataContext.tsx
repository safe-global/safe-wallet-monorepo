import { createContext, useContext, type ReactElement, type ReactNode } from 'react'
import type { BillingState } from './types'
import { createStarterBillingState } from './mocks'

// TODO: replace with RTK Query (useGetBillingQuery) and delete this context when the billing endpoint is wired.
const BillingDataContext = createContext<BillingState | null>(null)

export const BillingDataProvider = ({
  value,
  children,
}: {
  value?: BillingState
  children: ReactNode
}): ReactElement => {
  return (
    <BillingDataContext.Provider value={value ?? createStarterBillingState()}>{children}</BillingDataContext.Provider>
  )
}

export const useBillingData = (): BillingState => {
  const context = useContext(BillingDataContext)
  if (!context) {
    throw new Error('useBillingData must be used within a BillingDataProvider')
  }
  return context
}
