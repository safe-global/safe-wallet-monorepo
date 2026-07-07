import { render } from '@testing-library/react'
import SafeSelectorTriggerContent from '../SafeSelectorTriggerContent'
import type { SafeItemData } from '../../types'

const mockUseSafeDisplayName = jest.fn()
const mockUseChain = jest.fn()
const mockUseIsHypernativeGuard = jest.fn()

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: (...args: unknown[]) => mockUseSafeDisplayName(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChain: (...args: unknown[]) => mockUseChain(...args),
  useHasFeature: () => false,
}))

jest.mock('@/features/hypernative', () => ({
  __esModule: true,
  HypernativeFeature: {},
  useIsHypernativeGuard: (...args: unknown[]) => mockUseIsHypernativeGuard(...args),
}))

jest.mock('@/features/__core__', () => ({
  __esModule: true,
  useLoadFeature: () => ({ SafeHeaderHnTooltip: () => null }),
}))

jest.mock('../SafeBalanceBlock', () => {
  const Mock = () => <div data-testid="safe-balance-block" />
  Mock.displayName = 'SafeBalanceBlock'
  return { __esModule: true, default: Mock }
})

jest.mock('@/components/settings/EnvironmentVariables/EnvHintButton', () => {
  const Mock = () => null
  Mock.displayName = 'EnvHintButton'
  return { __esModule: true, default: Mock }
})

const createItem = (overrides: Partial<SafeItemData> = {}): SafeItemData => ({
  id: '1:0xabc',
  name: 'Space AB Name',
  address: '0xabc',
  threshold: 1,
  owners: 2,
  balance: '100',
  chains: [
    { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
    { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
  ],
  ...overrides,
})

describe('SafeSelectorTriggerContent', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUseSafeDisplayName.mockReturnValue('')
    mockUseChain.mockReturnValue(undefined)
    mockUseIsHypernativeGuard.mockReturnValue({ isHypernativeGuard: false, loading: false })
  })

  it('resolves name per chain without using the cross-chain item name', () => {
    const item = createItem({ name: 'Name from Ethereum' })

    render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="137" />)

    expect(mockUseSafeDisplayName).toHaveBeenCalledWith('0xabc', '137')
    expect(mockUseSafeDisplayName).not.toHaveBeenCalledWith('0xabc', '137', expect.anything())
  })

  it('displays the chain-specific resolved name', () => {
    mockUseSafeDisplayName.mockReturnValue('Polygon Name')
    const item = createItem()

    const { getByText } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="137" />)

    expect(getByText('Polygon Name')).toBeInTheDocument()
  })

  it('displays the address when no name exists for the current chain', () => {
    mockUseSafeDisplayName.mockReturnValue('')
    const item = createItem({ name: 'Name from Ethereum' })

    const { getByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="137" />)

    expect(getByTestId('safe-selector-trigger-address')).toHaveTextContent(/0xabc/)
  })

  it('writes out the full address on the address line', () => {
    const address = '0x245C153cBa7b65d01706B09a30dEf30190Da1878'
    const item = createItem({ address })

    const { getByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />)

    expect(getByTestId('safe-selector-trigger-address').textContent).toBe(address)
  })

  it('shows the not-activated warning icon instead of the balance when the selected chain is undeployed', () => {
    const item = createItem({
      chains: [
        { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth', isUndeployed: true },
        { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
      ],
    })

    const { getByTestId, queryByTestId } = render(
      <SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />,
    )

    expect(getByTestId('safe-selector-not-activated-icon')).toHaveAttribute('aria-label', 'Inactive')
    expect(queryByTestId('safe-balance-block')).not.toBeInTheDocument()
  })

  it('shows the activating label when the selected chain is being activated', () => {
    const item = createItem({
      chains: [
        {
          chainId: '1',
          chainName: 'Ethereum',
          chainLogoUri: null,
          shortName: 'eth',
          isUndeployed: true,
          isActivating: true,
        },
      ],
    })

    const { getByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />)

    expect(getByTestId('safe-selector-not-activated-icon')).toHaveAttribute('aria-label', 'Activating')
  })

  it('renders the threshold pill with the setup for a single-chain safe', () => {
    const item = createItem({
      threshold: 2,
      owners: 3,
      chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
    })

    const { getByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />)

    expect(getByTestId('account-threshold')).toHaveTextContent('2/3')
  })

  it('renders an icon-only threshold pill for a multi-chain safe (setup can differ per chain)', () => {
    const item = createItem({ threshold: 2, owners: 3 })

    const { getByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />)

    expect(getByTestId('account-threshold')).toBeInTheDocument()
    expect(getByTestId('account-threshold')).not.toHaveTextContent('2/3')
  })

  it('does not render the threshold pill when the setup is unknown', () => {
    const item = createItem({ threshold: 0, owners: 0 })

    const { queryByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />)

    expect(queryByTestId('account-threshold')).not.toBeInTheDocument()
  })

  it('shows the balance when the selected chain is deployed', () => {
    const item = createItem()

    const { getByTestId, queryByTestId } = render(
      <SafeSelectorTriggerContent selectedItem={item} selectedChainId="137" />,
    )

    expect(getByTestId('safe-balance-block')).toBeInTheDocument()
    expect(queryByTestId('safe-selector-not-activated-icon')).not.toBeInTheDocument()
  })

  it('renders a block explorer link for the selected chain when it has an explorer', () => {
    mockUseChain.mockReturnValue({
      chainId: '137',
      blockExplorerUriTemplate: { address: 'https://polygonscan.com/address/{{address}}', txHash: '', api: '' },
    })
    const item = createItem()

    const { getByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="137" />)

    expect(mockUseChain).toHaveBeenCalledWith('137')
    expect(getByTestId('safe-item-explorer-link')).toHaveAttribute('href', 'https://polygonscan.com/address/0xabc')
  })

  it('omits the explorer link when the selected chain has no block explorer', () => {
    mockUseChain.mockReturnValue({ chainId: '1' })
    const item = createItem()

    const { queryByTestId } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="1" />)

    expect(queryByTestId('safe-item-explorer-link')).not.toBeInTheDocument()
  })
})
