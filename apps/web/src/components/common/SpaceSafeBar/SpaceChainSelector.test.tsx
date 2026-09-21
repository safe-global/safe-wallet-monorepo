import type { ReactElement, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import SpaceChainSelector from './SpaceChainSelector'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'
import { useSafeAppUrl } from '@/hooks/safe-apps/useSafeAppUrl'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import type { ChainSelectorBlockProps } from '@/features/spaces'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/hooks/safe-apps/useSafeAppUrl', () => ({
  useSafeAppUrl: jest.fn(),
}))
jest.mock('./hooks/useSpaceChainSelector')
jest.mock(
  '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock',
  () =>
    function ChainSelectorBlock({
      deployedChains,
      selectedChainId,
      safeAddress,
      deployedChainIds,
      disabled,
    }: ChainSelectorBlockProps) {
      return (
        <div
          data-testid="chain-selector-block"
          data-deployed-count={String(deployedChains.length)}
          data-selected-chain-id={selectedChainId}
          data-safe-address={safeAddress}
          data-deployed-chain-ids={deployedChainIds.join(',')}
          data-disabled={String(Boolean(disabled))}
        />
      )
    },
)
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ render: renderProp, children }: { render?: ReactElement; children: ReactNode }) => (
    <div data-testid="tooltip-trigger" data-has-render-prop={String(Boolean(renderProp))}>
      {children}
    </div>
  ),
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))
jest.mock('@/features/multichain', () => ({
  CreateSafeOnNewChain: () => <div data-testid="create-safe-on-new-chain" />,
}))

const renderWithTxFlow = (txFlow: TxModalContextType['txFlow']) => {
  const value: TxModalContextType = {
    txFlow,
    setTxFlow: jest.fn(),
    setFullWidth: jest.fn(),
  }

  return render(
    <TxModalContext.Provider value={value}>
      <SpaceChainSelector />
    </TxModalContext.Provider>,
  )
}

const mockUseSpaceChainSelector = useSpaceChainSelector as jest.Mock

const singleChain = [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }]
const multiChain = [
  { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
]

describe('SpaceChainSelector', () => {
  beforeEach(() => {
    jest.mocked(useRouter).mockReturnValue({ pathname: '/', query: {} } as unknown as ReturnType<typeof useRouter>)
    jest.mocked(useSafeAppUrl).mockReturnValue(undefined)
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: singleChain,
      selectedChainId: '1',
      deployedChainIds: ['1'],
      safeAddress: '0xSafe1',
      safeName: 'My Safe',
      handleChainChange: jest.fn(),
    })
  })

  it('renders null when deployedChains is empty', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: [],
      selectedChainId: '1',
      deployedChainIds: [],
      safeAddress: '0xSafe1',
      safeName: undefined,
      handleChainChange: jest.fn(),
    })

    const { container } = render(<SpaceChainSelector />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders ChainSelectorBlock when deployed chains are present', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('space-chain-selector')).toBeInTheDocument()
    expect(screen.getByTestId('chain-selector-block')).toBeInTheDocument()
  })

  it('passes deployed chain count to ChainSelectorBlock', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-deployed-count', '1')
  })

  it('passes correct deployed count for multi-chain safe', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: multiChain,
      selectedChainId: '1',
      deployedChainIds: ['1', '137'],
      safeAddress: '0xSafe2',
      safeName: 'Multi Safe',
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-deployed-count', '2')
  })

  it('passes selectedChainId to ChainSelectorBlock', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: multiChain,
      selectedChainId: '137',
      deployedChainIds: ['1', '137'],
      safeAddress: '0xSafe2',
      safeName: 'Multi Safe',
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-selected-chain-id', '137')
  })

  it('passes safeAddress and deployedChainIds down to ChainSelectorBlock', () => {
    mockUseSpaceChainSelector.mockReturnValue({
      deployedChains: multiChain,
      selectedChainId: '1',
      deployedChainIds: ['1', '137'],
      safeAddress: '0xSafe2',
      safeName: 'Multi Safe',
      handleChainChange: jest.fn(),
    })

    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-safe-address', '0xSafe2')
    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-deployed-chain-ids', '1,137')
  })

  it('does not disable ChainSelectorBlock and does not render tooltip when no tx flow is active', () => {
    render(<SpaceChainSelector />)

    expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-disabled', 'false')
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })

  describe('when a tx flow is active', () => {
    const activeTxFlow = <div>active tx flow</div>

    it('disables ChainSelectorBlock', () => {
      renderWithTxFlow(activeTxFlow)

      expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-disabled', 'true')
    })

    it('wraps ChainSelectorBlock in a tooltip explaining the restriction', () => {
      renderWithTxFlow(activeTxFlow)

      const tooltip = screen.getByTestId('tooltip')
      expect(tooltip).toContainElement(screen.getByTestId('chain-selector-block'))
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
        'Changing the network is not allowed in this screen',
      )
    })
  })

  describe('when inside an opened Safe App', () => {
    it('disables ChainSelectorBlock on /apps/open with an appUrl', () => {
      jest.mocked(useRouter).mockReturnValue({
        pathname: AppRoutes.apps.open,
        query: { appUrl: 'https://example-safe-app.test' },
      } as unknown as ReturnType<typeof useRouter>)
      jest.mocked(useSafeAppUrl).mockReturnValue('https://example-safe-app.test')

      render(<SpaceChainSelector />)

      expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-disabled', 'true')
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
        'Changing the network is not allowed in this screen',
      )
    })

    it('does not disable ChainSelectorBlock on /apps/open without an appUrl', () => {
      jest
        .mocked(useRouter)
        .mockReturnValue({ pathname: AppRoutes.apps.open, query: {} } as unknown as ReturnType<typeof useRouter>)

      render(<SpaceChainSelector />)

      expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-disabled', 'false')
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('does not disable ChainSelectorBlock on /apps/custom', () => {
      jest.mocked(useRouter).mockReturnValue({
        pathname: AppRoutes.apps.custom,
        query: { safe: 'eth:0xSafe1' },
      } as unknown as ReturnType<typeof useRouter>)

      render(<SpaceChainSelector />)

      expect(screen.getByTestId('chain-selector-block')).toHaveAttribute('data-disabled', 'false')
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })
  })
})
