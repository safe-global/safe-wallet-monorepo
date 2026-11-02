import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { SidebarActionButton } from '../SidebarActionButton'

const mockSetTxFlow = jest.fn()
const mockTrackEvent = jest.fn()
const mockUseIsCounterfactualSafe = jest.fn()
const mockUseLoadFeature = jest.fn()

jest.mock('@/features/counterfactual', () => ({
  CounterfactualFeature: 'counterfactual-feature',
}))
jest.mock('@/features/counterfactual/hooks/useIsCounterfactualSafe', () => ({
  __esModule: true,
  default: () => mockUseIsCounterfactualSafe(),
}))

jest.mock('@/features/__core__/useLoadFeature', () => ({
  ...jest.requireActual('@/features/__core__/useLoadFeature'),
  useLoadFeature: () => mockUseLoadFeature(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))
jest.mock('@/services/analytics/events/overview', () => ({
  ...jest.requireActual('@/services/analytics/events/overview'),
  OVERVIEW_EVENTS: { NEW_TRANSACTION: { action: 'New transaction' } },
}))
jest.mock('@/services/analytics/mixpanel-events', () => ({
  ...jest.requireActual('@/services/analytics/mixpanel-events'),
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement' },
}))

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits/hooks/useIsOnlySpendingLimitBeneficiary', () => ({
  __esModule: true,
  ...jest.requireActual('@/features/spending-limits/hooks/useIsOnlySpendingLimitBeneficiary'),
  default: jest.fn(),
}))

jest.mock('@/components/tx-flow/flows', () => ({
  NewTxFlow: () => <div>NewTxFlow</div>,
}))

jest.mock('@safe-global/views/components/ui/button', () => ({
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
    mockRole('owner')
    mockSafeInfo({ deployed: true })
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

  it.each<TestRole>(['owner', 'proposer', 'spendingLimitBeneficiary'])('enables the button for a %s', (role) => {
    mockRole(role)

    renderWithContext(<SidebarActionButton />)

    expect(screen.getByTestId('new-tx-btn')).toBeEnabled()
  })

  it.each<TestRole>(['nonOwner', 'disconnected'])('disables the button for a %s', (role) => {
    mockRole(role)

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
