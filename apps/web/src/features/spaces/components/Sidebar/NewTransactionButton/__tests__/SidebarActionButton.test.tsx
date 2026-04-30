import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { SidebarActionButton } from '../SidebarActionButton'

const mockSetTxFlow = jest.fn()
const mockTrackEvent = jest.fn()
const mockUseIsCounterfactualSafe = jest.fn()
const mockUseLoadFeature = jest.fn()
let mockCheckWalletOk = true

jest.mock('@/features/counterfactual', () => ({
  useIsCounterfactualSafe: () => mockUseIsCounterfactualSafe(),
  CounterfactualFeature: 'counterfactual-feature',
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => mockUseLoadFeature(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  OVERVIEW_EVENTS: { NEW_TRANSACTION: { action: 'New transaction' } },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement' },
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(mockCheckWalletOk),
}))

jest.mock('@/components/tx-flow/flows', () => ({
  NewTxFlow: () => <div>NewTxFlow</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    'data-testid': dataTestId,
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    'data-testid'?: string
  }) => (
    <button data-testid={dataTestId} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

const renderWithContext = (ui: ReactElement) =>
  render(
    <TxModalContext.Provider
      value={{ txFlow: undefined, setTxFlow: mockSetTxFlow, setFullWidth: jest.fn() } as TxModalContextType}
    >
      {ui}
    </TxModalContext.Provider>,
  )

describe('SidebarActionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckWalletOk = true
    mockUseIsCounterfactualSafe.mockReturnValue(false)
    mockUseLoadFeature.mockReturnValue({ ActivateAccountButton: () => <button>Activate account</button> })
  })

  it('renders the New transaction button', () => {
    renderWithContext(<SidebarActionButton />)
    expect(screen.getByTestId('new-tx-btn')).toBeInTheDocument()
    expect(screen.getByText('New transaction')).toBeInTheDocument()
  })

  it('opens the tx flow and tracks the event on click', () => {
    renderWithContext(<SidebarActionButton />)
    fireEvent.click(screen.getByTestId('new-tx-btn'))

    expect(mockSetTxFlow).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'sidebar' }),
      expect.objectContaining({ sidebarElement: 'New Transaction' }),
    )
  })

  it('disables the button when the wallet check fails', () => {
    mockCheckWalletOk = false
    renderWithContext(<SidebarActionButton />)
    expect(screen.getByTestId('new-tx-btn')).toBeDisabled()
  })

  it('renders ActivateAccountButton when Safe is counterfactual', () => {
    mockUseIsCounterfactualSafe.mockReturnValue(true)
    renderWithContext(<SidebarActionButton />)

    expect(screen.getByText('Activate account')).toBeInTheDocument()
    expect(screen.queryByTestId('new-tx-btn')).not.toBeInTheDocument()
  })
})
