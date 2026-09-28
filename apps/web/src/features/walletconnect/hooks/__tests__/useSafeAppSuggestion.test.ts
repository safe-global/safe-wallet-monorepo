import { renderHook } from '@/tests/test-utils'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { useIsSafeAppSuggested } from '../useSafeAppSuggestion'

const mockDismissed = jest.fn(() => undefined as boolean | undefined)
jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: () => [mockDismissed(), jest.fn()],
}))

const mockHasFeature = jest.fn(() => true as boolean | undefined)
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1', chainName: 'Ethereum' }] }),
  useHasFeature: () => mockHasFeature(),
}))

const mockSafeInfo = jest.fn(() => ({ safe: { chainId: '1' }, safeLoaded: true }))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockSafeInfo(),
}))

const mockSanctioned = jest.fn(() => null as string | null)
jest.mock('@/hooks/useSanctionedAddress', () => ({
  useSanctionedAddress: () => mockSanctioned(),
}))

const mockCounterfactual = jest.fn(() => false)
jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: () => mockCounterfactual(),
}))

const mockSafeApp: SafeAppData = {
  id: 1,
  url: 'https://test-dapp.com',
  name: 'Test App',
  description: '',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
}

const makeProposal = (
  overrides: { isScam?: boolean; origin?: string; chains?: string[]; validation?: string; name?: string } = {},
) =>
  ({
    id: 1,
    params: {
      proposer: {
        publicKey: 'k',
        metadata: { name: overrides.name ?? 'Test dApp', description: '', url: 'https://test-dapp.com', icons: [] },
      },
      requiredNamespaces: {
        eip155: { methods: [], chains: overrides.chains ?? ['eip155:1'], events: [] },
      },
      optionalNamespaces: {},
    },
    verifyContext: {
      verified: {
        validation: overrides.validation ?? 'VALID',
        origin: overrides.origin ?? 'https://test-dapp.com',
        verifyUrl: '',
        isScam: overrides.isScam ?? false,
      },
    },
  }) as unknown as WalletKitTypes.SessionProposal

describe('useIsSafeAppSuggested', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDismissed.mockReturnValue(undefined)
    mockSafeInfo.mockReturnValue({ safe: { chainId: '1' }, safeLoaded: true })
    mockSanctioned.mockReturnValue(null)
    mockCounterfactual.mockReturnValue(false)
    mockHasFeature.mockReturnValue(true)
  })

  it('suggests the Safe App for a normal proposal', () => {
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal(), mockSafeApp))
    expect(result.current).toBe(true)
  })

  it('does not suggest without a proposal or a matching app', () => {
    expect(renderHook(() => useIsSafeAppSuggested(null, mockSafeApp)).result.current).toBe(false)
    expect(renderHook(() => useIsSafeAppSuggested(makeProposal(), undefined)).result.current).toBe(false)
  })

  it('does not suggest when the feature flag is off', () => {
    mockHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal(), mockSafeApp))
    expect(result.current).toBe(false)
  })

  // useHasFeature is undefined until the chain config loads; fail closed rather than flash
  it('does not suggest while the chain config is still loading', () => {
    mockHasFeature.mockReturnValue(undefined)
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal(), mockSafeApp))
    expect(result.current).toBe(false)
  })

  it('does not suggest once dismissed', () => {
    mockDismissed.mockReturnValue(true)
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal(), mockSafeApp))
    expect(result.current).toBe(false)
  })

  it('does not suggest for a scam dApp', () => {
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal({ isScam: true }), mockSafeApp))
    expect(result.current).toBe(false)
  })

  it('does not suggest on an unsupported chain', () => {
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal({ chains: ['eip155:137'] }), mockSafeApp))
    expect(result.current).toBe(false)
  })

  // Connecting from the suggestion skips the connection form, so risk warnings there would
  // never be seen
  it('does not suggest for a dApp with an invalid domain', () => {
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal({ validation: 'INVALID' }), mockSafeApp))
    expect(result.current).toBe(false)
  })

  // Otherwise a dApp WalletConnect could not verify would get a one-click approve with its
  // origin never shown
  it('does not suggest when the domain could not be verified', () => {
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal({ validation: 'UNKNOWN' }), mockSafeApp))
    expect(result.current).toBe(false)
  })

  // BlockedBridges is a separate list from WarnedBridges; both must suppress the one-click path
  it('does not suggest for a blocked bridge', () => {
    const { result } = renderHook(() =>
      useIsSafeAppSuggested(makeProposal({ origin: 'https://cbridge.celer.network' }), mockSafeApp),
    )
    expect(result.current).toBe(false)
  })

  it('does not suggest for a warned bridge', () => {
    const { result } = renderHook(() =>
      useIsSafeAppSuggested(makeProposal({ origin: 'https://bridge.arbitrum.io' }), mockSafeApp),
    )
    expect(result.current).toBe(false)
  })

  it('does not suggest for an undeployed Safe', () => {
    mockCounterfactual.mockReturnValue(true)
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal(), mockSafeApp))
    expect(result.current).toBe(false)
  })

  it('does not suggest for a sanctioned address on Safe Pass', () => {
    mockSanctioned.mockReturnValue('0x1234')
    const { result } = renderHook(() =>
      useIsSafeAppSuggested(makeProposal({ origin: 'https://community.safe.global' }), mockSafeApp),
    )
    expect(result.current).toBe(false)
  })

  it('does not suggest before the Safe is loaded', () => {
    mockSafeInfo.mockReturnValue({ safe: { chainId: '1' }, safeLoaded: false })
    const { result } = renderHook(() => useIsSafeAppSuggested(makeProposal(), mockSafeApp))
    expect(result.current).toBe(false)
  })
})
