import { faker } from '@faker-js/faker'
import { act, renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { safeAppBuilder, sessionProposalBuilder } from '@/tests/builders/walletConnect'
import { useSafeAppSuggestion } from '../useSafeAppSuggestion'

const safeApp = safeAppBuilder().build()

const mockMatch = jest.fn()
jest.mock('../useMatchingSafeApp', () => ({
  useMatchingSafeApp: (url?: string) => mockMatch(url),
}))

const mockHasFeature = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [chainBuilder().with({ chainId: '1' }).build()] }),
  useHasFeature: () => mockHasFeature(),
}))

const mockSafeInfo = jest.fn()
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockSafeInfo(),
}))

const mockSanctioned = jest.fn()
jest.mock('@/hooks/useSanctionedAddress', () => ({
  useSanctionedAddress: () => mockSanctioned(),
}))

const mockCounterfactual = jest.fn()
jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: () => mockCounterfactual(),
}))

describe('useSafeAppSuggestion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasFeature.mockReturnValue(true)
    mockMatch.mockReturnValue({ safeApp, isLoading: false })
    mockSafeInfo.mockReturnValue({ safe: { chainId: '1' }, safeLoaded: true })
    mockSanctioned.mockReturnValue(undefined)
    mockCounterfactual.mockReturnValue(false)
  })

  it('shows the Safe App for a verified dApp', () => {
    const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

    expect(result.current.status).toBe('shown')
    expect(result.current.safeApp).toBe(safeApp)
  })

  it('looks up the Safe App by the verified origin, not the declared URL', () => {
    const proposal = sessionProposalBuilder({ origin: 'https://real.example', url: 'https://claimed.example' })

    renderHook(() => useSafeAppSuggestion(proposal))

    expect(mockMatch).toHaveBeenCalledWith('https://real.example')
  })

  it.each([
    ['the feature flag is off', () => mockHasFeature.mockReturnValue(false)],
    ['the chain config is still loading', () => mockHasFeature.mockReturnValue(undefined)],
  ])('is off and skips the lookup when %s', (_, arrange) => {
    arrange()

    const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

    expect(result.current.status).toBe('off')
    expect(mockMatch).toHaveBeenCalledWith(undefined)
  })

  it('is off without a proposal', () => {
    const { result } = renderHook(() => useSafeAppSuggestion(null))

    expect(result.current.status).toBe('off')
  })

  it('is loading while the lookup is in flight', () => {
    mockMatch.mockReturnValue({ safeApp: undefined, isLoading: true })

    const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

    expect(result.current.status).toBe('loading')
  })

  it('is none when the dApp has no Safe App', () => {
    mockMatch.mockReturnValue({ safeApp: undefined, isLoading: false })

    const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

    expect(result.current.status).toBe('none')
  })

  it.each([
    ['a scam', () => sessionProposalBuilder({ isScam: true })],
    ['an unverified domain', () => sessionProposalBuilder({ validation: 'UNKNOWN' })],
    ['an unsupported chain', () => sessionProposalBuilder({ chains: ['eip155:137'] })],
  ])('is none for %s, so the connection form shows its warning', (_, buildProposal) => {
    const { result } = renderHook(() => useSafeAppSuggestion(buildProposal()))

    expect(result.current.status).toBe('none')
  })

  it.each([
    ['the Safe is not loaded', () => mockSafeInfo.mockReturnValue({ safe: { chainId: '1' }, safeLoaded: false })],
    ['the Safe is not deployed', () => mockCounterfactual.mockReturnValue(true)],
  ])('is none when %s', (_, arrange) => {
    arrange()

    const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

    expect(result.current.status).toBe('none')
  })

  it('is none for a sanctioned address on Safe{Pass}', () => {
    mockSanctioned.mockReturnValue('0x1234')

    const proposal = sessionProposalBuilder({ origin: 'https://community.safe.global' })
    const { result } = renderHook(() => useSafeAppSuggestion(proposal))

    expect(result.current.status).toBe('none')
  })

  // useLocalStorage caches per key across tests, so each test uses its own dApp origin
  describe('after the user chose', () => {
    type Action = (suggestion: ReturnType<typeof useSafeAppSuggestion>) => void
    const chooseSafeApp: Action = (s) => s.choose('safeApp')
    const chooseWalletConnect: Action = (s) => s.choose('walletConnect')
    const dismiss: Action = (s) => s.dismiss()

    const actAndReconnect = (action: Action, { remember }: { remember: boolean }) => {
      const origin = faker.internet.url({ appendSlash: false })
      const { result, rerender } = renderHook(({ proposal }) => useSafeAppSuggestion(proposal), {
        initialProps: { proposal: sessionProposalBuilder({ origin }) },
      })
      act(() => result.current.setRemember(remember))
      act(() => action(result.current))
      expect(result.current.status).toBe('resolved')

      return (overrides: Parameters<typeof sessionProposalBuilder>[0] = {}) => {
        rerender({ proposal: sessionProposalBuilder({ origin, ...overrides }) })
        return result.current
      }
    }

    it('opens the Safe App without asking for a dApp remembered as Safe App', () => {
      const reconnect = actAndReconnect(chooseSafeApp, { remember: true })

      expect(reconnect().status).toBe('redirect')
    })

    it('goes straight to WalletConnect for a dApp remembered as WalletConnect', () => {
      const reconnect = actAndReconnect(chooseWalletConnect, { remember: true })

      expect(reconnect().status).toBe('none')
    })

    it.each([
      ['Safe App', chooseSafeApp],
      ['WalletConnect', chooseWalletConnect],
    ])('still asks for other dApps after remembering %s for one', (_, action) => {
      const reconnect = actAndReconnect(action, { remember: true })

      expect(reconnect({ origin: faker.internet.url({ appendSlash: false }) }).status).toBe('shown')
    })

    it.each([
      ['choosing without ticking the box', chooseSafeApp, false],
      ['leaving without a choice', dismiss, true],
    ])('asks again after %s', (_, action, remember) => {
      const reconnect = actAndReconnect(action, { remember })

      expect(reconnect().status).toBe('shown')
    })

    it('does not open a remembered Safe App when the new proposal has a warning', () => {
      const reconnect = actAndReconnect(chooseSafeApp, { remember: true })

      expect(reconnect({ validation: 'UNKNOWN' }).status).toBe('none')
    })

    it('starts the next proposal with the box unticked', () => {
      const reconnect = actAndReconnect(dismiss, { remember: true })

      expect(reconnect().remember).toBe(false)
    })
  })
})
