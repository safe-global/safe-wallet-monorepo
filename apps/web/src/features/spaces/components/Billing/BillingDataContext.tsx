import { createContext, useContext, type ReactElement, type ReactNode } from 'react'
import type { BillingState } from './types'
import { createStarterBillingState } from './mocks'

const BillingDataContext = createContext<BillingState | null>(null)

/**
 * Supplies plan / subscription / usage state to the Billing page. Defaults to mock data so the
 * shell is demoable before the real endpoints exist; consumers keep the same `useBillingData()`
 * signature once it's wired to RTK Query.
 */
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
