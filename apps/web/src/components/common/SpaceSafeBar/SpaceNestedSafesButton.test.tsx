import { render, screen, fireEvent } from '@testing-library/react'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import SpaceNestedSafesButton from './SpaceNestedSafesButton'

const mockStartFiltering = jest.fn()

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safe: {
      chainId: '1',
      address: { value: '0xSafe1' },
      deployed: true,
    },
  })),
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/owners', () => ({
  useOwnersGetSafesByOwnerV1Query: jest.fn(),
}))

jest.mock('@/hooks/useNestedSafesVisibility', () => ({
  useNestedSafesVisibility: jest.fn(),
}))

jest.mock('@/components/sidebar/NestedSafesPopover', () => ({
  NestedSafesPopover: (props: Record<string, unknown>) => (
    <div data-testid="nested-safes-popover" data-open={String(!!props.anchorEl)} />
  ),
}))

jest.mock('@/components/common/Track', () => {
  const MockTrack = ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <div data-testid="track" data-action={props.action as string} data-label={props.label as string}>
      {children}
    </div>
  )
  MockTrack.displayName = 'Track'
  return { __esModule: true, default: MockTrack }
})

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, render }: { children: React.ReactNode; render: React.ReactElement }) => (
    <div>
      {render}
      {children}
    </div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import useSafeInfo from '@/hooks/useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'

const mockUseSafeInfo = useSafeInfo as jest.Mock
const mockUseHasFeature = useHasFeature as jest.Mock
const mockUseOwnersQuery = useOwnersGetSafesByOwnerV1Query as jest.Mock
const mockUseNestedSafesVisibility = useNestedSafesVisibility as jest.Mock

describe('SpaceNestedSafesButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1', address: { value: '0xSafe1' }, deployed: true },
    })
    mockUseHasFeature.mockReturnValue(true)
    mockUseOwnersQuery.mockReturnValue({ currentData: { safes: ['0xNested1', '0xNested2'] } })
    mockUseNestedSafesVisibility.mockReturnValue({
      visibleSafes: [{ address: '0xNested1' }],
      allSafesWithStatus: [{ address: '0xNested1' }, { address: '0xNested2' }],
      hasCompletedCuration: true,
      isLoading: false,
      startFiltering: mockStartFiltering,
      hasStarted: true,
    })
  })

  it('renders nothing when NESTED_SAFES feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = render(<SpaceNestedSafesButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when safe is not deployed', () => {
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1', address: { value: '0xSafe1' }, deployed: false },
    })

    const { container } = render(<SpaceNestedSafesButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the button when feature is enabled and safe is deployed', () => {
    render(<SpaceNestedSafesButton />)
    expect(screen.getByTestId('nested-safes-button')).toBeInTheDocument()
  })

  it('displays the visible safes count in the badge', () => {
    render(<SpaceNestedSafesButton />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('displays raw count before filtering has started', () => {
    mockUseNestedSafesVisibility.mockReturnValue({
      visibleSafes: [],
      allSafesWithStatus: [],
      hasCompletedCuration: false,
      isLoading: false,
      startFiltering: mockStartFiltering,
      hasStarted: false,
    })

    render(<SpaceNestedSafesButton />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays raw count while loading', () => {
    mockUseNestedSafesVisibility.mockReturnValue({
      visibleSafes: [],
      allSafesWithStatus: [],
      hasCompletedCuration: false,
      isLoading: true,
      startFiltering: mockStartFiltering,
      hasStarted: true,
    })

    render(<SpaceNestedSafesButton />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders without badge when ownedSafes data is not yet available', () => {
    mockUseOwnersQuery.mockReturnValue({ currentData: undefined })
    mockUseNestedSafesVisibility.mockReturnValue({
      visibleSafes: [],
      allSafesWithStatus: [],
      hasCompletedCuration: false,
      isLoading: false,
      startFiltering: mockStartFiltering,
      hasStarted: true,
    })

    render(<SpaceNestedSafesButton />)
    expect(screen.getByTestId('nested-safes-button')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('does not display badge when count is zero', () => {
    mockUseOwnersQuery.mockReturnValue({ currentData: { safes: [] } })
    mockUseNestedSafesVisibility.mockReturnValue({
      visibleSafes: [],
      allSafesWithStatus: [],
      hasCompletedCuration: false,
      isLoading: false,
      startFiltering: mockStartFiltering,
      hasStarted: true,
    })

    render(<SpaceNestedSafesButton />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('calls startFiltering when clicked', () => {
    render(<SpaceNestedSafesButton />)

    fireEvent.click(screen.getByTestId('nested-safes-button'))
    expect(mockStartFiltering).toHaveBeenCalledTimes(1)
  })

  it('opens NestedSafesPopover when clicked', () => {
    render(<SpaceNestedSafesButton />)

    expect(screen.getByTestId('nested-safes-popover')).toHaveAttribute('data-open', 'false')

    fireEvent.click(screen.getByTestId('nested-safes-button'))
    expect(screen.getByTestId('nested-safes-popover')).toHaveAttribute('data-open', 'true')
  })

  it('tracks the OPEN_LIST event with space_safe_bar label', () => {
    render(<SpaceNestedSafesButton />)

    const track = screen.getByTestId('track')
    expect(track).toHaveAttribute('data-action', 'Open nested Safe list')
    expect(track).toHaveAttribute('data-label', 'space_safe_bar')
  })

  describe('disabled while a tx flow is active', () => {
    const renderWithTxFlow = (txFlow: TxModalContextType['txFlow']) => {
      const value: TxModalContextType = {
        txFlow,
        setTxFlow: jest.fn(),
        setFullWidth: jest.fn(),
      }
      return render(
        <TxModalContext.Provider value={value}>
          <SpaceNestedSafesButton />
        </TxModalContext.Provider>,
      )
    }

    it('disables the button when a tx flow is open', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      const button = screen.getByTestId('nested-safes-button')
      expect(button).toBeDisabled()
    })

    it('applies the disabled styling to the button when a tx flow is open', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      const button = screen.getByTestId('nested-safes-button')
      expect(button.className).toMatch(/cursor-not-allowed/)
      expect(button.className).toMatch(/opacity-50/)
      expect(button.className).not.toMatch(/cursor-pointer/)
    })

    it('shows the explanatory tooltip text when a tx flow is open', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      expect(screen.getByText('Nested Safes are not allowed in this screen')).toBeInTheDocument()
      expect(screen.queryByText('Nested Safes')).not.toBeInTheDocument()
    })

    it('does not open the popover or call startFiltering when clicked while disabled', () => {
      renderWithTxFlow(<div data-testid="active-tx-flow" />)

      fireEvent.click(screen.getByTestId('nested-safes-button'))

      expect(mockStartFiltering).not.toHaveBeenCalled()
      expect(screen.getByTestId('nested-safes-popover')).toHaveAttribute('data-open', 'false')
    })

    it('renders the original tooltip and remains enabled when no tx flow is active', () => {
      renderWithTxFlow(undefined)

      const button = screen.getByTestId('nested-safes-button')
      expect(button).not.toBeDisabled()
      expect(button.className).not.toMatch(/cursor-not-allowed/)
      expect(button.className).not.toMatch(/opacity-50/)
      expect(screen.getByText('Nested Safes')).toBeInTheDocument()
      expect(screen.queryByText('Nested Safes are not allowed in this screen')).not.toBeInTheDocument()
    })
  })
})
