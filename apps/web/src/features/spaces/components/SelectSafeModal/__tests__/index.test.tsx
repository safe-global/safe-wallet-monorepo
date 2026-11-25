import { render, screen } from '@/tests/test-utils'
import SelectSafeModal from '../index'
import { ESafeAction } from '../../../public/store/safeActionsModalSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { NO_ACTIVATED_SAFES_MESSAGE } from '../constants'

const SWAP_DISABLED_TOOLTIP = 'Swap is not supported on this chain. Try another chain.'

const deployedSafe: SafeItem = {
  chainId: '1',
  address: '0x0000000000000000000000000000000000000001',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
}

const cfSafe: SafeItem = {
  chainId: '1',
  address: '0x0000000000000000000000000000000000000002',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
}

const cardProps: Array<{ safe: SafeItem; disabled?: boolean; disabledTooltip?: string }> = []

jest.mock('../../../public/components/SafeCardReadOnly', () => ({
  __esModule: true,
  default: (props: { safe: SafeItem; disabled?: boolean; disabledTooltip?: string }) => {
    cardProps.push({ safe: props.safe, disabled: props.disabled, disabledTooltip: props.disabledTooltip })
    return <div data-testid={`card-${props.safe.chainId}:${props.safe.address}`} />
  },
}))

jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, render }: { children: React.ReactNode; render: React.ReactElement }) => (
    <div data-testid="tooltip-trigger" data-trigger={render.type as string}>
      {children}
    </div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div role="tooltip">{children}</div>,
}))

jest.mock('../useSafeActionMapper', () => ({
  __esModule: true,
  default: () => ({ actionMapper: {}, resetActiveSafe: jest.fn() }),
}))

const mockUseSpaceSafes = jest.fn()
jest.mock('../../../public/hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
}))

const mockUseChains = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => mockUseChains(),
}))

const mockUseWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

const mockGetSignerStatus = jest.fn()
jest.mock('../../../hooks/useSafeSignerCheck', () => ({
  useSafeSignerCheck: () => mockGetSignerStatus,
}))

const renderModal = (actionType: ESafeAction, undeployedSafes: Record<string, Record<string, unknown>> = {}) =>
  render(<SelectSafeModal />, {
    initialReduxState: {
      safeActionsModal: { opened: true, type: actionType },
      undeployedSafes,
    } as never,
  })

const chainWithSwap = {
  chainId: '1',
  chainName: 'Ethereum',
  shortName: 'eth',
  features: [FEATURES.NATIVE_SWAPS],
}

const chainWithoutSwap = {
  chainId: '137',
  chainName: 'Polygon',
  shortName: 'matic',
  features: [],
}

const getCardFor = (safe: SafeItem) => cardProps.find((c) => c.safe.address === safe.address)

const getTooltipFor = (safe: SafeItem) =>
  screen
    .getByTestId(`card-${safe.chainId}:${safe.address}`)
    .closest('[data-testid="tooltip"]')
    ?.querySelector('[role="tooltip"]')?.textContent ?? undefined

const cfState = (safe: SafeItem) => ({ [safe.chainId]: { [safe.address]: { status: {} } } })

describe('SelectSafeModal swap disabling', () => {
  beforeEach(() => {
    cardProps.length = 0
    mockUseWallet.mockReturnValue({ address: '0x0000000000000000000000000000000000000abc' })
    mockUseChains.mockReturnValue({ configs: [chainWithSwap, chainWithoutSwap] })
    mockUseSpaceSafes.mockReturnValue({ allSafes: [deployedSafe, cfSafe], isLoading: false })
  })

  it('keeps a deployed safe on a swap-supported chain enabled', () => {
    renderModal(ESafeAction.Swap, cfState(cfSafe))

    const card = getCardFor(deployedSafe)
    expect(card?.disabled).toBe(false)
    expect(getTooltipFor(deployedSafe)).toBeUndefined()
  })

  it('disables a safe on a chain without swaps with the unsupported-chain tooltip', () => {
    const safeOnUnsupportedChain: SafeItem = { ...deployedSafe, chainId: '137' }
    mockUseSpaceSafes.mockReturnValue({ allSafes: [safeOnUnsupportedChain], isLoading: false })

    renderModal(ESafeAction.Swap)

    const card = getCardFor(safeOnUnsupportedChain)
    expect(card?.disabled).toBe(true)
    expect(getTooltipFor(safeOnUnsupportedChain)).toBe(SWAP_DISABLED_TOOLTIP)
  })
})

describe('SelectSafeModal counterfactual safes', () => {
  beforeEach(() => {
    cardProps.length = 0
    mockGetSignerStatus.mockReturnValue('signer')
    mockUseWallet.mockReturnValue({ address: '0x0000000000000000000000000000000000000abc' })
    mockUseChains.mockReturnValue({ configs: [chainWithSwap] })
    mockUseSpaceSafes.mockReturnValue({ allSafes: [deployedSafe, cfSafe], isLoading: false })
  })

  it.each(Object.values(ESafeAction))('hides counterfactual safes for the %s action', (action) => {
    renderModal(action, cfState(cfSafe))

    expect(getCardFor(cfSafe)).toBeUndefined()
    expect(getCardFor(deployedSafe)?.disabled).toBe(false)
  })

  it.each(Object.values(ESafeAction))('shows an empty state for %s when every safe is counterfactual', (action) => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: [cfSafe], isLoading: false })

    const { getByText } = renderModal(action, cfState(cfSafe))

    expect(cardProps).toHaveLength(0)
    expect(getByText(NO_ACTIVATED_SAFES_MESSAGE)).toBeInTheDocument()
  })
})

describe('SelectSafeModal new transaction gating', () => {
  beforeEach(() => {
    cardProps.length = 0
    mockGetSignerStatus.mockReturnValue('signer')
    mockUseChains.mockReturnValue({ configs: [chainWithSwap] })
    mockUseSpaceSafes.mockReturnValue({ allSafes: [deployedSafe, cfSafe], isLoading: false })
    mockUseWallet.mockReturnValue({ address: '0x0000000000000000000000000000000000000abc' })
  })

  it('disables every safe with the connect-wallet tooltip when no wallet is connected', () => {
    mockUseWallet.mockReturnValue(null)

    renderModal(ESafeAction.NewTransaction, cfState(cfSafe))

    const card = getCardFor(deployedSafe)
    expect(card?.disabled).toBe(true)
    expect(getTooltipFor(deployedSafe)).toBe('Please connect your wallet')
  })

  it('disables a Safe the wallet has no role on with the not-a-signer tooltip', () => {
    mockGetSignerStatus.mockReturnValue('not-signer')

    renderModal(ESafeAction.NewTransaction)

    const card = getCardFor(deployedSafe)
    expect(card?.disabled).toBe(true)
    expect(getTooltipFor(deployedSafe)).toBe('Your connected wallet is not a signer of this Safe account')
  })

  it("anchors the tooltip to a block around the card, not to the card's own tooltip", () => {
    mockGetSignerStatus.mockReturnValue('not-signer')

    renderModal(ESafeAction.NewTransaction)

    const card = screen.getByTestId(`card-${deployedSafe.chainId}:${deployedSafe.address}`)
    expect(card.closest('[data-testid="tooltip-trigger"]')).toHaveAttribute('data-trigger', 'div')
    expect(getCardFor(deployedSafe)?.disabledTooltip).toBeUndefined()
  })

  it('keeps a Safe disabled without a tooltip while its role checks are pending', () => {
    mockGetSignerStatus.mockReturnValue('pending')

    renderModal(ESafeAction.NewTransaction)

    const card = getCardFor(deployedSafe)
    expect(card?.disabled).toBe(true)
    expect(getTooltipFor(deployedSafe)).toBeUndefined()
  })

  it('shows the connect-wallet tooltip before the not-a-signer one', () => {
    mockUseWallet.mockReturnValue(null)
    mockGetSignerStatus.mockReturnValue('not-signer')

    renderModal(ESafeAction.NewTransaction)

    expect(getTooltipFor(deployedSafe)).toBe('Please connect your wallet')
  })

  it('does not apply the signer check to send', () => {
    mockGetSignerStatus.mockReturnValue('not-signer')

    renderModal(ESafeAction.Send)

    expect(getCardFor(deployedSafe)?.disabled).toBe(false)
  })
})
