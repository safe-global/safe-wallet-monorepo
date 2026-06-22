import { renderHook } from '@testing-library/react'
import { BillingDataProvider, useBillingData } from '../BillingDataContext'
import { createPaidBillingState } from '../mocks'

describe('BillingDataContext', () => {
  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useBillingData())).toThrow('useBillingData must be used within a BillingDataProvider')
  })

  it('provides the default mock (Starter) state', () => {
    const { result } = renderHook(() => useBillingData(), {
      wrapper: ({ children }) => <BillingDataProvider>{children}</BillingDataProvider>,
    })

    expect(result.current.subscription).toBeNull()
    expect(result.current.planGroups.length).toBeGreaterThan(0)
  })

  it('provides an injected value override', () => {
    const value = createPaidBillingState()
    const { result } = renderHook(() => useBillingData(), {
      wrapper: ({ children }) => <BillingDataProvider value={value}>{children}</BillingDataProvider>,
    })

    expect(result.current.subscription?.planName).toBe('Pro')
  })
})
