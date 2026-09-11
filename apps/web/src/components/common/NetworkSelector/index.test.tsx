import type { ReactNode } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { render, screen, fireEvent } from '@/tests/test-utils'
import NetworkSelector from './index'

const mockChain = (chainId: string, chainName: string, isTestnet = false) =>
  ({
    chainId,
    chainName,
    shortName: chainName.slice(0, 3).toLowerCase(),
    isTestnet,
    chainLogoUri: null,
    theme: { backgroundColor: '#fff', textColor: '#000' },
  }) as Chain

const mockChains = [
  mockChain('1', 'Ethereum'),
  mockChain('137', 'Polygon'),
  mockChain('100', 'Gnosis Chain'),
  mockChain('11155111', 'Sepolia', true),
]

// base-ui keeps the popup in a portal that synthetic clicks do not reliably open under jsdom, so the
// popup parts render inline here. The data-slot attributes match the real primitive because the
// component finds its rows by them.
jest.mock('@/components/ui/select', () => ({
  __esModule: true,
  Select: ({
    children,
    open,
    onOpenChange,
  }: {
    children?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => (
    <div data-testid="select-root">
      <button type="button" data-testid="select-toggle" onClick={() => onOpenChange?.(!open)} />
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children?: ReactNode }) => <div data-slot="select-trigger">{children}</div>,
  SelectValue: ({ children }: { children?: ReactNode | (() => ReactNode) }) => (
    <div data-slot="select-value">{typeof children === 'function' ? children() : children}</div>
  ),
  SelectContent: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <div data-slot="select-content" data-testid="select-content" className={className}>
      {children}
    </div>
  ),
  // tabIndex mirrors base-ui's roving tabindex; jsdom will not focus a div without one.
  SelectItem: ({ children, value, ...props }: { children?: ReactNode; value?: string }) => (
    <div data-slot="select-item" data-value={value} tabIndex={-1} {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains, error: undefined, loading: false }),
  useChain: (chainId: string) => mockChains.find((chain) => chain.chainId === chainId),
  useCurrentChain: () => mockChains[0],
}))

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))

jest.mock('@/hooks/useSafeAddress', () => ({ __esModule: true, default: () => '' }))

jest.mock('@/hooks/safes', () => ({ useAllSafesGrouped: () => ({ allMultiChainSafes: [], allSingleSafes: [] }) }))

jest.mock('@/hooks/useAddressBook', () => ({ __esModule: true, default: () => ({}) }))

jest.mock('@/features/multichain', () => ({
  __esModule: true,
  hasMultiChainAddNetworkFeature: () => false,
  useSafeCreationData: () => [undefined, undefined, false],
  CreateSafeOnSpecificChain: () => null,
}))

describe('NetworkSelector', () => {
  it('should, when the dropdown is open, render the search field above the first network', () => {
    render(<NetworkSelector />)

    const search = screen.getByTestId('network-selector-search-input')
    const firstNetwork = screen.getAllByTestId('network-selector-item')[0]

    expect(search).toHaveAttribute('placeholder', 'Search networks')
    expect(search.compareDocumentPosition(firstNetwork) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('should, when the search is empty, list every available network', () => {
    render(<NetworkSelector />)

    const listed = screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Ethereum', 'Polygon', 'Gnosis Chain', 'Sepolia'])
  })

  it('should, when a network name is typed, list only the matching network', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'gnosis' } })

    const listed = screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Gnosis Chain'])
    expect(screen.queryByTestId('network-selector-empty')).not.toBeInTheDocument()
  })

  it('should, when the typed term differs in case, still list the matching network', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'POLY' } })

    const listed = screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Polygon'])
  })

  it('should, when the typed term is only whitespace, list every available network', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: '   ' } })

    const listed = screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

    expect(listed).toEqual(['Ethereum', 'Polygon', 'Gnosis Chain', 'Sepolia'])
  })

  it('should, when a network is filtered down to, keep the link that switches to it', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'polygon' } })

    const row = screen.getByTestId('network-selector-item')

    expect(row).toHaveAttribute('data-value', '137')
    expect(row.querySelector('a')).toHaveAttribute('href', expect.stringContaining('pol'))
  })

  it('should, when nothing matches, show the no-matches message and no networks', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'no-such-network' } })

    expect(screen.queryAllByTestId('network-selector-item')).toHaveLength(0)
    expect(screen.getByTestId('network-selector-empty')).toHaveTextContent('No networks match your search')
  })

  it('should, when the no-matches message appears, announce it to a screen reader', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'no-such-network' } })

    expect(screen.getByTestId('network-selector-empty')).toHaveAttribute('role', 'status')
  })

  it('should, when the search is empty, not show the no-matches message', () => {
    render(<NetworkSelector />)

    expect(screen.queryByTestId('network-selector-empty')).not.toBeInTheDocument()
  })

  it('should, when no testnet matches, hide the testnets divider', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'ethereum' } })

    expect(screen.queryByText('Testnets')).not.toBeInTheDocument()
  })

  it('should, when a testnet matches, keep it under the testnets divider', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'sepolia' } })

    const listed = screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

    expect(screen.getByText('Testnets')).toBeInTheDocument()
    expect(listed).toEqual(['Sepolia'])
  })

  it('should, when the dropdown is reopened, clear the previous search', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'gnosis' } })
    fireEvent.click(screen.getByTestId('select-toggle'))
    fireEvent.click(screen.getByTestId('select-toggle'))

    const listed = screen.getAllByTestId('network-selector-item').map((item) => item.textContent?.trim())

    expect(screen.getByTestId('network-selector-search-input')).toHaveValue('')
    expect(listed).toEqual(['Ethereum', 'Polygon', 'Gnosis Chain', 'Sepolia'])
  })

  it('should, when a letter is typed, keep it from the select that reads letters as typeahead', () => {
    const onSelectKeyDown = jest.fn()
    render(
      <div onKeyDown={onSelectKeyDown}>
        <NetworkSelector />
      </div>,
    )

    fireEvent.keyDown(screen.getByTestId('network-selector-search-input'), { key: 'g' })

    expect(onSelectKeyDown).not.toHaveBeenCalled()
  })

  it('should, when Enter is pressed, keep it from the select so no unseen row is committed', () => {
    const onSelectKeyDown = jest.fn()
    render(
      <div onKeyDown={onSelectKeyDown}>
        <NetworkSelector />
      </div>,
    )

    fireEvent.keyDown(screen.getByTestId('network-selector-search-input'), { key: 'Enter' })

    expect(onSelectKeyDown).not.toHaveBeenCalled()
  })

  it('should, when Escape is pressed, pass it to the select so the popup can close', () => {
    const onSelectKeyDown = jest.fn()
    render(
      <div onKeyDown={onSelectKeyDown}>
        <NetworkSelector />
      </div>,
    )

    fireEvent.keyDown(screen.getByTestId('network-selector-search-input'), { key: 'Escape' })

    expect(onSelectKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }))
  })

  it('should, when ArrowDown is pressed after filtering, move focus to the first matching network', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'pol' } })
    fireEvent.keyDown(screen.getByTestId('network-selector-search-input'), { key: 'ArrowDown' })

    expect(document.activeElement).toBe(screen.getAllByTestId('network-selector-item')[0])
    expect(document.activeElement).toHaveTextContent('Polygon')
  })

  it('should, when ArrowUp is pressed after filtering, move focus to the last matching network', () => {
    render(<NetworkSelector />)

    fireEvent.change(screen.getByTestId('network-selector-search-input'), { target: { value: 'pol' } })
    fireEvent.keyDown(screen.getByTestId('network-selector-search-input'), { key: 'ArrowUp' })

    const listed = screen.getAllByTestId('network-selector-item')

    expect(document.activeElement).toBe(listed[listed.length - 1])
    expect(document.activeElement).toHaveTextContent('Sepolia')
  })

  it('should, when ArrowDown is pressed and nothing matches, leave focus in the search field', () => {
    render(<NetworkSelector />)

    const search = screen.getByTestId('network-selector-search-input')
    fireEvent.change(search, { target: { value: 'no-such-network' } })
    search.focus()
    fireEvent.keyDown(search, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(search)
  })
})
