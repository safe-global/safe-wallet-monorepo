import { server } from '@/tests/server'
import { trialPaymentLinkBuilder } from '@/tests/builders/trialPaymentLink'
import { trialPlansHandler } from '@/tests/msw/workspaceWizard'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useTrialSizes } from '../hooks/useTrialSizes'

let mockIsSafePro = true
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockIsSafePro,
}))

describe('useTrialSizes', () => {
  it('is undefined while the trial plans load, then lists each size by seats', async () => {
    mockIsSafePro = true
    const small = trialPaymentLinkBuilder({ planName: 'Starter', seats: 2, trialPeriodDays: 30 }).build()
    const large = trialPaymentLinkBuilder({ planName: 'Business', seats: 20, trialPeriodDays: 30 }).build()
    server.use(trialPlansHandler([large, small]))

    const { result } = renderHook(() => useTrialSizes())

    expect(result.current.sizes).toBeUndefined()
    await waitFor(() => expect(result.current.sizes?.map((size) => size.seats)).toEqual([2, 20]))
    expect(result.current.trialPeriodDays).toBe(30)
  })

  it('skips the trial plans without Safe Pro', () => {
    mockIsSafePro = false

    const { result } = renderHook(() => useTrialSizes())

    expect(result.current.sizes).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })
})
