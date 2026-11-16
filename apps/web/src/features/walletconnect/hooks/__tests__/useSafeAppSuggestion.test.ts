import { faker } from '@faker-js/faker'
import { act, renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { safeAppBuilder, sessionProposalBuilder } from '@/tests/builders/walletConnect'
import { REMEMBER_CHOICE_DAYS, useSafeAppSuggestion } from '../useSafeAppSuggestion'

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
    ['a verified warned bridge', () => sessionProposalBuilder({ origin: 'https://bridge.arbitrum.io' })],
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

  it.each([
    ['loading', { safeApp: undefined, isLoading: true }, true],
    ['shown', { safeApp, isLoading: false }, true],
    ['none', { safeApp: undefined, isLoading: false }, false],
  ])('reports whether %s blocks auto-approve', (_, match, blocks) => {
    mockMatch.mockReturnValue(match)

    const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

    expect(result.current.blocksAutoApprove).toBe(blocks)
  })

  describe('with a remembered choice', () => {
    const renderForOrigin = (origin: string, overrides: Parameters<typeof sessionProposalBuilder>[0] = {}) =>
      renderHook(() => useSafeAppSuggestion(sessionProposalBuilder({ origin, ...overrides })))

    const rememberFor = (origin: string, choice: 'safeApp' | 'walletConnect') => {
      const { result } = renderForOrigin(origin)
      act(() => result.current.rememberChoice(origin, choice))
    }

    it('opens the Safe App without asking for a dApp remembered as Safe App', () => {
      const origin = faker.internet.url({ appendSlash: false })
      rememberFor(origin, 'safeApp')

      const { result } = renderForOrigin(origin)

      expect(result.current.status).toBe('redirect')
      expect(result.current.blocksAutoApprove).toBe(true)
    })

    it('goes straight to WalletConnect for a dApp remembered as WalletConnect', () => {
      const origin = faker.internet.url({ appendSlash: false })
      rememberFor(origin, 'walletConnect')

      expect(renderForOrigin(origin).result.current.status).toBe('none')
    })

    it.each(['safeApp', 'walletConnect'] as const)('still asks for other dApps after remembering %s', (choice) => {
      rememberFor(faker.internet.url({ appendSlash: false }), choice)

      expect(renderForOrigin(faker.internet.url({ appendSlash: false })).result.current.status).toBe('shown')
    })

    it('does not open a remembered Safe App when the new proposal has a warning', () => {
      const origin = faker.internet.url({ appendSlash: false })
      rememberFor(origin, 'safeApp')

      expect(renderForOrigin(origin, { validation: 'UNKNOWN' }).result.current.status).toBe('none')
    })

    describe('over time', () => {
      const savedAt = new Date('2026-01-01T00:00:00Z').getTime()
      const daysLater = (days: number) => savedAt + days * 24 * 60 * 60 * 1000

      afterEach(() => jest.restoreAllMocks())

      it.each([
        [REMEMBER_CHOICE_DAYS - 1, 'redirect'],
        [REMEMBER_CHOICE_DAYS, 'shown'],
      ])('after %s days the suggestion status is %s', (days, status) => {
        const origin = faker.internet.url({ appendSlash: false })
        const now = jest.spyOn(Date, 'now').mockReturnValue(savedAt)
        rememberFor(origin, 'safeApp')

        now.mockReturnValue(daysLater(days))

        expect(renderForOrigin(origin).result.current.status).toBe(status)
      })
    })
  })

  describe('"Remember my choice for this dApp"', () => {
    it('is ticked by default', () => {
      const { result } = renderHook(() => useSafeAppSuggestion(sessionProposalBuilder()))

      expect(result.current.remember).toBe(true)
    })

    it('can be unticked', () => {
      const proposal = sessionProposalBuilder()
      const { result } = renderHook(() => useSafeAppSuggestion(proposal))

      act(() => result.current.setRemember(false))

      expect(result.current.remember).toBe(false)
    })

    it('is ticked again for the next proposal', () => {
      const { result, rerender } = renderHook(({ proposal }) => useSafeAppSuggestion(proposal), {
        initialProps: { proposal: sessionProposalBuilder() },
      })
      act(() => result.current.setRemember(false))

      rerender({ proposal: sessionProposalBuilder() })

      expect(result.current.remember).toBe(true)
    })
  })
})
