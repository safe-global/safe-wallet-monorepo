import { render } from '@/tests/test-utils'
import SelectSafeModal from '../index'
import { ESafeAction } from '../../../public/store/safeActionsModalSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { NO_ACTIVATED_SAFES_MESSAGE } from '../constants'

const SWAP_DISABLED_TOOLTIP = 'Swap is not supported on this chain. Try another chain.'
const SWAP_DISABLED_CF_TOOLTIP = 'This account is not activated yet and cannot swap.'

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
    return null
  },
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

const cfState = (safe: SafeItem) => ({ [safe.chainId]: { [safe.address]: { status: {} } } })

describe('SelectSafeModal swap disabling', () => {
  beforeEach(() => {
    cardProps.length = 0
    mockUseWallet.mockReturnValue({ address: '0x0000000000000000000000000000000000000abc' })
    mockUseChains.mockReturnValue({ configs: [chainWithSwap, chainWithoutSwap] })
    mockUseSpaceSafes.mockReturnValue({ allSafes: [deployedSafe, cfSafe], isLoading: false })
  })

  it('disables a counterfactual safe with the activation tooltip for the swap action', () => {
    renderModal(ESafeAction.Swap, cfState(cfSafe))

    const card = getCardFor(cfSafe)
    expect(card?.disabled).toBe(true)
    expect(card?.disabledTooltip).toBe(SWAP_DISABLED_CF_TOOLTIP)
  })

  it('keeps a deployed safe on a swap-supported chain enabled', () => {
    renderModal(ESafeAction.Swap, cfState(cfSafe))

    const card = getCardFor(deployedSafe)
    expect(card?.disabled).toBe(false)
    expect(card?.disabledTooltip).toBeUndefined()
  })

  it('prefers the unsupported-chain tooltip over the counterfactual one', () => {
    const cfOnUnsupportedChain: SafeItem = { ...cfSafe, chainId: '137' }
    mockUseSpaceSafes.mockReturnValue({ allSafes: [cfOnUnsupportedChain], isLoading: false })

    renderModal(ESafeAction.Swap, cfState(cfOnUnsupportedChain))

    const card = getCardFor(cfOnUnsupportedChain)
    expect(card?.disabled).toBe(true)
    expect(card?.disabledTooltip).toBe(SWAP_DISABLED_TOOLTIP)
  })

  it('does not disable a counterfactual safe for non-swap actions', () => {
    renderModal(ESafeAction.Send, cfState(cfSafe))

    const card = getCardFor(cfSafe)
    expect(card?.disabled).toBe(false)
    expect(card?.disabledTooltip).toBeUndefined()
  })
})

describe('SelectSafeModal new transaction gating', () => {
  beforeEach(() => {
    cardProps.length = 0
    mockUseChains.mockReturnValue({ configs: [chainWithSwap] })
    mockUseSpaceSafes.mockReturnValue({ allSafes: [deployedSafe, cfSafe], isLoading: false })
    mockUseWallet.mockReturnValue({ address: '0x0000000000000000000000000000000000000abc' })
  })

  it('hides counterfactual safes from the new transaction picker', () => {
    renderModal(ESafeAction.NewTransaction, cfState(cfSafe))

    expect(getCardFor(cfSafe)).toBeUndefined()
    expect(getCardFor(deployedSafe)?.disabled).toBe(false)
  })

  it('shows an empty state when every safe is counterfactual', () => {
    mockUseSpaceSafes.mockReturnValue({ allSafes: [cfSafe], isLoading: false })

    const { getByText } = renderModal(ESafeAction.NewTransaction, cfState(cfSafe))

    expect(cardProps).toHaveLength(0)
    expect(getByText(NO_ACTIVATED_SAFES_MESSAGE)).toBeInTheDocument()
  })

  it('disables every safe with the connect-wallet tooltip when no wallet is connected', () => {
    mockUseWallet.mockReturnValue(null)

    renderModal(ESafeAction.NewTransaction, cfState(cfSafe))

    const card = getCardFor(deployedSafe)
    expect(card?.disabled).toBe(true)
    expect(card?.disabledTooltip).toBe('Please connect your wallet')
  })

  it('keeps counterfactual safes visible for other actions', () => {
    mockUseWallet.mockReturnValue(null)

    renderModal(ESafeAction.Send, cfState(cfSafe))

    expect(getCardFor(cfSafe)?.disabled).toBe(false)
    expect(getCardFor(deployedSafe)?.disabled).toBe(false)
  })
})
