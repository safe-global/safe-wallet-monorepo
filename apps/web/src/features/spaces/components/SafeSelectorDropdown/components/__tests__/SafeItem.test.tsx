import { fireEvent, render, screen } from '@testing-library/react'
import SafeItem from '../SafeItem'
import type { SafeItemData, SafeItemDataChain } from '../../types'

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: () => 'Test Safe',
}))

const mockUseAddressBookItem = jest.fn()
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (...args: unknown[]) => mockUseAddressBookItem(...args),
}))

jest.mock('@/components/common/SpaceSafeBar/AccountsModal/shared', () => ({
  NameSourceIcon: ({ source }: { source: string }) => <span data-testid="name-source-icon" data-source={source} />,
}))

jest.mock('../SafeInfoDisplay', () => {
  const Mock = ({ nameAction, nameIndicator }: { nameAction?: React.ReactNode; nameIndicator?: React.ReactNode }) => (
    <div data-testid="safe-info-display">
      {nameIndicator}
      {nameAction}
    </div>
  )
  Mock.displayName = 'SafeInfoDisplay'
  return { __esModule: true, default: Mock }
})

jest.mock('../BalanceDisplay', () => {
  const Mock = () => <div data-testid="balance-display" />
  Mock.displayName = 'BalanceDisplay'
  return { __esModule: true, default: Mock }
})

jest.mock('../ChainLogo', () => {
  const Mock = ({ chainId }: { chainId: string }) => <div data-testid={`chain-logo-${chainId}`} />
  Mock.displayName = 'ChainLogo'
  return { __esModule: true, default: Mock }
})

jest.mock('@/components/common/FiatValue', () => {
  const Mock = () => <span />
  Mock.displayName = 'FiatValue'
  return { __esModule: true, default: Mock }
})

const makeChain = (overrides: Partial<SafeItemDataChain> = {}): SafeItemDataChain => ({
  chainId: '1',
  chainName: 'Ethereum',
  chainLogoUri: null,
  shortName: 'eth',
  ...overrides,
})

const createItem = (chain: SafeItemDataChain): SafeItemData => ({
  id: '1:0xaaa',
  name: 'Test Safe',
  address: '0xaaa',
  threshold: 1,
  owners: 2,
  balance: '0',
  chains: [chain],
})

describe('SafeItem undeployed state', () => {
  it('renders the Not activated badge instead of the balance for an undeployed chain', () => {
    render(<SafeItem {...createItem(makeChain({ isUndeployed: true }))} />)

    expect(screen.getByLabelText('Inactive')).toBeInTheDocument()
    expect(screen.queryByTestId('balance-display')).not.toBeInTheDocument()
  })

  it('renders the Activating label for an activating chain', () => {
    render(<SafeItem {...createItem(makeChain({ isUndeployed: true, isActivating: true }))} />)

    expect(screen.getByLabelText('Activating')).toBeInTheDocument()
  })

  it('renders the balance for a deployed chain', () => {
    render(<SafeItem {...createItem(makeChain())} />)

    expect(screen.getByTestId('balance-display')).toBeInTheDocument()
    expect(screen.queryByTestId('not-activated-badge')).not.toBeInTheDocument()
  })

  it('renders the activation status in the shared row-end column (same trailing slot as the balance)', () => {
    render(<SafeItem {...createItem(makeChain({ isUndeployed: true }))} />)

    expect(screen.getByTestId('row-end-column')).toContainElement(screen.getByTestId('not-activated-badge'))
  })
})

describe('SafeItem rename pencil', () => {
  it('shows no pencil when canRename is false', () => {
    render(<SafeItem {...createItem(makeChain())} canRename={false} onRename={jest.fn()} />)

    expect(screen.queryByTestId('rename-safe-btn')).not.toBeInTheDocument()
  })

  it('calls onRename with address, all chainIds and the resolved name', () => {
    const onRename = jest.fn()
    render(<SafeItem {...createItem(makeChain())} canRename onRename={onRename} />)

    fireEvent.click(screen.getByTestId('rename-safe-btn'))

    expect(onRename).toHaveBeenCalledWith({
      address: '0xaaa',
      chainIds: ['1'],
      currentName: 'Test Safe',
    })
  })
})

describe('SafeItem name source indicator', () => {
  afterEach(() => mockUseAddressBookItem.mockReset())

  it('shows the source icon for a space (shared) name', () => {
    mockUseAddressBookItem.mockReturnValue({ name: 'Shared name', source: 'space' })
    render(<SafeItem {...createItem(makeChain())} />)

    expect(screen.getByTestId('name-source-icon')).toHaveAttribute('data-source', 'space')
  })

  it('shows the source icon for a local name', () => {
    mockUseAddressBookItem.mockReturnValue({ name: 'Local name', source: 'local' })
    render(<SafeItem {...createItem(makeChain())} />)

    expect(screen.getByTestId('name-source-icon')).toHaveAttribute('data-source', 'local')
  })

  it('shows no source icon when the address has no address-book entry', () => {
    mockUseAddressBookItem.mockReturnValue(undefined)
    render(<SafeItem {...createItem(makeChain())} />)

    expect(screen.queryByTestId('name-source-icon')).not.toBeInTheDocument()
  })
})
