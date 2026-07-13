import { render, screen, fireEvent } from '@testing-library/react'
import ReorderableSafeList, { reorderAddresses } from '../ReorderableSafeList'
import type { SafeItemData } from '../../types'

jest.mock('../SafeItem', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="safe-item">{name}</div>,
}))

jest.mock('../MultiChainSafeItemRow', () => ({
  __esModule: true,
  default: ({ item, leading }: { item: { name: string }; leading?: React.ReactNode }) => (
    <div data-testid="multichain-row">
      {leading}
      <span>{item.name}</span>
    </div>
  ),
}))

const ADDR_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const ADDR_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const ADDR_C = '0xcccccccccccccccccccccccccccccccccccccccc'

const item = (address: string, name: string): SafeItemData => ({
  id: `1:${address}`,
  name,
  address,
  threshold: 1,
  owners: 2,
  balance: '100',
  chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
})

describe('reorderAddresses', () => {
  const items = [item(ADDR_A, 'A'), item(ADDR_B, 'B'), item(ADDR_C, 'C')]

  it('moves an item down', () => {
    expect(reorderAddresses(items, 0, 2)).toEqual([ADDR_B, ADDR_C, ADDR_A])
  })

  it('moves an item up', () => {
    expect(reorderAddresses(items, 2, 0)).toEqual([ADDR_C, ADDR_A, ADDR_B])
  })

  it('is a no-op when source and destination match', () => {
    expect(reorderAddresses(items, 1, 1)).toEqual([ADDR_A, ADDR_B, ADDR_C])
  })

  it('does not mutate the input', () => {
    const input = [item(ADDR_A, 'A'), item(ADDR_B, 'B')]
    reorderAddresses(input, 0, 1)
    expect(input.map((i) => i.address)).toEqual([ADDR_A, ADDR_B])
  })
})

describe('ReorderableSafeList', () => {
  const renderList = (onSelect = jest.fn()) => {
    render(
      <ReorderableSafeList
        items={[item(ADDR_A, 'A'), item(ADDR_B, 'B')]}
        selectedItemId={`1:${ADDR_B}`}
        onSelect={onSelect}
        onReorder={jest.fn()}
      />,
    )
    return onSelect
  }

  it('renders a draggable row with a grip for every item', () => {
    renderList()
    expect(screen.getByTestId('safe-selector-reorder-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('reorder-safe-row')).toHaveLength(2)
    expect(screen.getAllByTestId('safe-drag-handle')).toHaveLength(2)
  })

  it('marks the current safe row for the scroll-into-view anchor', () => {
    renderList()
    const rows = screen.getAllByTestId('reorder-safe-row')
    expect(rows[0]).not.toHaveAttribute('data-current-safe')
    expect(rows[1]).toHaveAttribute('data-current-safe', 'true')
  })

  it('navigates when a row is clicked', () => {
    const onSelect = renderList()
    fireEvent.click(screen.getAllByTestId('reorder-safe-row')[0])
    expect(onSelect).toHaveBeenCalledWith(`1:${ADDR_A}`)
  })

  it('does not navigate when the grip itself is clicked', () => {
    const onSelect = renderList()
    fireEvent.click(screen.getAllByTestId('safe-drag-handle')[0])
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('ReorderableSafeList multi-chain items', () => {
  const multiChainItem = (address: string, name: string): SafeItemData => ({
    id: `1:${address}`,
    name,
    address,
    threshold: 1,
    owners: 2,
    balance: '100',
    chains: [
      { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
      { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
    ],
  })

  it('renders an expandable multi-chain group with a grip instead of a navigate-on-click row', () => {
    const onSelect = jest.fn()
    render(
      <ReorderableSafeList
        items={[multiChainItem(ADDR_A, 'Multi')]}
        selectedItemId={`1:${ADDR_A}`}
        onSelect={onSelect}
        onReorder={jest.fn()}
      />,
    )

    // The multi-chain row reuses MultiChainSafeItemRow (expand/collapse) and hosts the grip in its summary.
    expect(screen.getByTestId('multichain-row')).toBeInTheDocument()
    expect(screen.getByTestId('safe-drag-handle')).toBeInTheDocument()

    // Clicking the row must not jump to a single network — navigation happens on the per-chain rows.
    fireEvent.click(screen.getByTestId('reorder-safe-row'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
