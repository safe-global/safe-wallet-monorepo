import { render } from '@testing-library/react'
import SafeSelectorTriggerContent from './SafeSelectorTriggerContent'
import type { SafeItemData } from '../types'

const mockUseSafeDisplayName = jest.fn()

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: (...args: unknown[]) => mockUseSafeDisplayName(...args),
}))

jest.mock('./SafeBalanceBlock', () => {
  const Mock = () => <div data-testid="safe-balance-block" />
  Mock.displayName = 'SafeBalanceBlock'
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

    const { getByText } = render(<SafeSelectorTriggerContent selectedItem={item} selectedChainId="137" />)

    // When no name is resolved, getSafeDisplayInfo falls back to prefixed address
    expect(getByText(/0xabc/)).toBeInTheDocument()
  })
})
