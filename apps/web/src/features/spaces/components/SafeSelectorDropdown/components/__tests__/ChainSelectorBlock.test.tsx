import type { ReactNode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// base-ui's portal does not open from a synthetic click under jsdom, so the popup parts render inline.
jest.mock('@/components/ui/dropdown-menu', () => ({
  __esModule: true,
  DropdownMenu: ({
    children,
    open,
    onOpenChange,
  }: {
    children?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => (
    <div data-testid="menu-root">
      <button type="button" data-testid="menu-toggle" onClick={() => onOpenChange?.(!open)} />
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ render: trigger }: { render?: ReactNode }) => (
    <div data-slot="dropdown-menu-trigger">{trigger}</div>
  ),
  DropdownMenuContent: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <div data-slot="dropdown-menu-content" className={className}>
      {children}
    </div>
  ),
}))

jest.mock('../ChainLogo', () => ({
  __esModule: true,
  default: ({ chainId }: { chainId: string }) => <span data-testid="chain-logo" data-chain-id={chainId} />,
}))

// The all-networks list has its own spec; here it only has to report what is handed down to it.
jest.mock('../AllNetworksSection', () => ({
  __esModule: true,
  default: ({ search, hasMatchesAbove }: { search?: string; hasMatchesAbove?: boolean }) => (
    <div data-testid="all-networks" data-search={search} data-has-matches-above={String(hasMatchesAbove)} />
  ),
}))

import ChainSelectorBlock from '../ChainSelectorBlock'

const deployedChains = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
  { chainId: '8453', chainName: 'Base', chainLogoUri: null, shortName: 'base' },
]

describe('ChainSelectorBlock', () => {
  it('should, when the picker is open, render the search field above the first network', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    const search = screen.getByTestId('chain-selector-search-input')
    const firstNetwork = screen.getAllByTestId('deployed-chain-btn')[0]

    expect(search).toHaveAttribute('placeholder', 'Search networks')
    expect(search.compareDocumentPosition(firstNetwork) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('should, when the search is empty, list every deployed network', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    const listed = screen.getAllByTestId('deployed-chain-btn').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Ethereum', 'Polygon', 'Base'])
  })

  it('should, when a network name is typed, list only the matching deployed network', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'polygon' } })

    const listed = screen.getAllByTestId('deployed-chain-btn').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Polygon'])
  })

  it('should, when the typed term differs in case, still list the matching network', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'BASE' } })

    const listed = screen.getAllByTestId('deployed-chain-btn').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Base'])
  })

  it('should, when the typed term is only whitespace, list every deployed network', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: '   ' } })

    const listed = screen.getAllByTestId('deployed-chain-btn').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Ethereum', 'Polygon', 'Base'])
  })

  it('should, when nothing matches, list no deployed network', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'no-such-network' } })

    expect(screen.queryAllByTestId('deployed-chain-btn')).toHaveLength(0)
  })

  it('should, when a filtered network is clicked, switch to that network', () => {
    const onChainSelect = jest.fn()
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={onChainSelect}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'polygon' } })
    fireEvent.click(screen.getByTestId('deployed-chain-btn'))

    expect(onChainSelect).toHaveBeenCalledWith('137', expect.anything())
  })

  it('should, when a query is typed, hand it to the all-networks section', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: ' OPti ' } })

    expect(screen.getByTestId('all-networks')).toHaveAttribute('data-search', 'opti')
  })

  it('should, when the search is empty, hand no query to the all-networks section', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    expect(screen.getByTestId('all-networks')).toHaveAttribute('data-search', '')
  })

  it('should, when a deployed network matches, tell the all-networks section it has matches above', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'polygon' } })

    expect(screen.getByTestId('all-networks')).toHaveAttribute('data-has-matches-above', 'true')
  })

  it('should, when no deployed network matches, tell the all-networks section it has none above', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'no-such-network' } })

    expect(screen.getByTestId('all-networks')).toHaveAttribute('data-has-matches-above', 'false')
  })

  it('should, when the picker is reopened, clear the previous search', () => {
    render(
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId="1"
        safeAddress="0xSafe"
        deployedChainIds={['1', '137', '8453']}
        onChainSelect={jest.fn()}
        onAddNetwork={jest.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('chain-selector-search-input'), { target: { value: 'polygon' } })
    fireEvent.click(screen.getByTestId('menu-toggle'))
    fireEvent.click(screen.getByTestId('menu-toggle'))

    const listed = screen.getAllByTestId('deployed-chain-btn').map((item) => item.textContent?.trim())

    expect(screen.getByTestId('chain-selector-search-input')).toHaveValue('')
    expect(listed).toEqual(['Ethereum', 'Polygon', 'Base'])
  })

  it('should, when a letter is typed, keep it from the menu that reads letters as typeahead', () => {
    const onMenuKeyDown = jest.fn()
    render(
      <div onKeyDown={onMenuKeyDown}>
        <ChainSelectorBlock
          deployedChains={deployedChains}
          selectedChainId="1"
          safeAddress="0xSafe"
          deployedChainIds={['1', '137', '8453']}
          onChainSelect={jest.fn()}
          onAddNetwork={jest.fn()}
        />
      </div>,
    )

    fireEvent.keyDown(screen.getByTestId('chain-selector-search-input'), { key: 'p' })

    expect(onMenuKeyDown).not.toHaveBeenCalled()
  })

  it('should, when Escape is pressed, pass it to the menu so the popup can close', () => {
    const onMenuKeyDown = jest.fn()
    render(
      <div onKeyDown={onMenuKeyDown}>
        <ChainSelectorBlock
          deployedChains={deployedChains}
          selectedChainId="1"
          safeAddress="0xSafe"
          deployedChainIds={['1', '137', '8453']}
          onChainSelect={jest.fn()}
          onAddNetwork={jest.fn()}
        />
      </div>,
    )

    fireEvent.keyDown(screen.getByTestId('chain-selector-search-input'), { key: 'Escape' })

    expect(onMenuKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
  })
})
