import { renderHook } from '@testing-library/react'
import useAddressSimilarity from '../useAddressSimilarity'
import * as storeHooks from '@/store'
import * as useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

jest.mock('@/store', () => ({ useAppSelector: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))

const mockUseAppSelector = storeHooks.useAppSelector as jest.Mock
const mockUseHasFeature = useChains.useHasFeature as jest.Mock
const mockUseWallet = useWallet as unknown as jest.Mock

const TRUSTED = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const LOOKALIKE = '0xa1b2ffffffffffffffffffffffffffffffff5678' // mimics TRUSTED 4+4
const UNRELATED = '0x7f3e9a01bc4d2e8f00112233445566778899aabb'
const WALLET = '0x1111111111111111111111111111111111111111'

// Real selectors run against this fake state via the useAppSelector mock.
const buildState = (dismissedForWallet: string[] = []) => ({
  addressBook: { '1': { [TRUSTED]: 'Alice' } },
  addedSafes: {},
  settings: { curatedNestedSafes: {} },
  undeployedSafes: {},
  addressPoisoning: {
    dismissedByAccount: dismissedForWallet.length
      ? { [WALLET.toLowerCase()]: dismissedForWallet.map((a) => a.toLowerCase()) }
      : {},
  },
})

const useFakeState = (state: ReturnType<typeof buildState>) =>
  mockUseAppSelector.mockImplementation((selector: (s: unknown) => unknown) => selector(state))

describe('useAddressSimilarity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue({ address: WALLET })
    mockUseHasFeature.mockReturnValue(true)
    useFakeState(buildState())
  })

  it('returns the matched anchor for a lookalike when the feature is enabled', () => {
    const { result } = renderHook(() => useAddressSimilarity(LOOKALIKE))
    expect(result.current?.severity).toBe(Severity.CRITICAL)
    expect(result.current?.anchor).toBe(TRUSTED.toLowerCase().slice(2))
  })

  it('returns null when the feature flag is off for the chain', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useAddressSimilarity(LOOKALIKE))
    expect(result.current).toBeNull()
  })

  it('returns null when the candidate has been dismissed for this account', () => {
    useFakeState(buildState([LOOKALIKE]))
    const { result } = renderHook(() => useAddressSimilarity(LOOKALIKE))
    expect(result.current).toBeNull()
  })

  it('returns null for no address or an unrelated address', () => {
    const { result: empty } = renderHook(() => useAddressSimilarity(undefined))
    expect(empty.current).toBeNull()
    const { result: unrelated } = renderHook(() => useAddressSimilarity(UNRELATED))
    expect(unrelated.current).toBeNull()
  })
})
