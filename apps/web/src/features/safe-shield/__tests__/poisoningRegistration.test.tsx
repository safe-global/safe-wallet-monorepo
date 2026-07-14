import { renderHook, waitFor } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import {
  SafeShieldProvider,
  useSafeShield,
  useSafeShieldForAddressPoisoning,
  useAddressPoisoningCheck,
} from '@/features/safe-shield/SafeShieldContext'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { StatusGroup } from '@safe-global/utils/features/safe-shield/types'

const mockUseHasFeature = jest.fn(() => true)
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

// mock ONLY the sibling analyses (like the real create step: nothing registered)
jest.mock('@/features/safe-shield/hooks', () => ({
  ...jest.requireActual('@/features/safe-shield/hooks'),
  useRecipientAnalysis: jest.fn(() => undefined),
  useCounterpartyAnalysis: jest.fn(() => ({
    recipient: [undefined, undefined, false],
    contract: [undefined, undefined, false],
    deadlock: [undefined, undefined, false],
  })),
  useThreatAnalysis: jest.fn(() => [undefined, undefined, false]),
}))
jest.mock('@/hooks/useIsTrustedSafe', () => ({ __esModule: true, default: jest.fn(() => true) }))
jest.mock('@/features/myAccounts', () => ({ useTrustSafe: jest.fn(() => ({ trustSafe: jest.fn() })) }))
jest.mock('@/features/hypernative', () => ({ useAuthToken: jest.fn(() => [{ token: undefined }]) }))

const ANCHOR = checksumAddress('0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678')
const LOOKALIKE = checksumAddress('0xa1b2ffffffffffffffffffffffffffffffff5678')
const CLEAN = checksumAddress('0x7f3e9a01bc4d2e8f00112233445566778899aabb')
const addressBookState = { addressBook: { '11155111': { [ANCHOR]: 'Alice' } } } as never

const wrapper = ({ children }: { children: ReactNode }) => <SafeShieldProvider>{children}</SafeShieldProvider>

describe('integration: poisoning-only registration through the real provider', () => {
  it('produces a recipient entry with the ADDRESS_POISONING group', async () => {
    const { result } = renderHook(() => useSafeShieldForAddressPoisoning([LOOKALIKE]), {
      wrapper,
      initialReduxState: { addressBook: { '11155111': { [ANCHOR]: 'Alice' } } } as never,
    })

    await waitFor(() => {
      const [data] = result.current
      expect(data?.[LOOKALIKE]?.[StatusGroup.ADDRESS_POISONING]?.[0]?.title).toBe('Potential address poisoning')
    })
  })
})

describe('useAddressPoisoningCheck', () => {
  it('registers a look-alike (ignoring falsy entries) and re-checks when the value changes', async () => {
    const { result, rerender } = renderHook(
      ({ addrs }: { addrs: Array<string | undefined> }) => {
        useAddressPoisoningCheck(addrs)
        return useSafeShield().recipient
      },
      { wrapper, initialProps: { addrs: [LOOKALIKE, undefined] }, initialReduxState: addressBookState },
    )

    // The look-alike is flagged; the undefined entry is filtered out.
    await waitFor(() => expect(result.current[0]?.[LOOKALIKE]?.[StatusGroup.ADDRESS_POISONING]).toBeDefined())

    // A fresh array with the same value keeps the flag (stable, no thrash).
    rerender({ addrs: [LOOKALIKE] })
    expect(result.current[0]?.[LOOKALIKE]?.[StatusGroup.ADDRESS_POISONING]).toBeDefined()

    // Changing to a non-look-alike drops the entry.
    rerender({ addrs: [CLEAN] })
    await waitFor(() => expect(result.current[0]?.[LOOKALIKE]).toBeUndefined())
  })
})
