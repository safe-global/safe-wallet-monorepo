import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import NonPinnedWarning from './index'
import useNonPinnedSafeWarning from '../../hooks/useNonPinnedSafeWarning'
import * as analytics from '@/services/analytics'

jest.mock('../../hooks/useNonPinnedSafeWarning')
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

type MockedHook = jest.MockedFunction<typeof useNonPinnedSafeWarning>
const mockUseNonPinnedSafeWarning = useNonPinnedSafeWarning as MockedHook

describe('NonPinnedWarning', () => {
  const mockOpenConfirmDialog = jest.fn()
  const mockCloseConfirmDialog = jest.fn()
  const mockConfirmAndAddToPinnedList = jest.fn()

  const defaultHookReturn = {
    shouldShowWarning: true,
    safeAddress: '0x1234567890123456789012345678901234567890',
    safeName: undefined,
    chainId: '1',
    userRole: 'owner' as const,
    hasSimilarAddress: false,
    similarAddresses: [],
    isConfirmDialogOpen: false,
    openConfirmDialog: mockOpenConfirmDialog,
    closeConfirmDialog: mockCloseConfirmDialog,
    confirmAndAddToPinnedList: mockConfirmAndAddToPinnedList,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNonPinnedSafeWarning.mockReturnValue(defaultHookReturn)
  })

  it('should render warning card when shouldShowWarning is true', () => {
    render(<NonPinnedWarning />)

    expect(screen.getByTestId('non-pinned-warning')).toBeInTheDocument()
    expect(screen.getByText('Not in your trusted list')).toBeInTheDocument()
    expect(screen.getByText(/haven.t marked it as trusted yet/i)).toBeInTheDocument()
  })

  it('should not render when shouldShowWarning is false', () => {
    mockUseNonPinnedSafeWarning.mockReturnValue({
      ...defaultHookReturn,
      shouldShowWarning: false,
    })

    const { container } = render(<NonPinnedWarning />)

    expect(container.firstChild).toBeNull()
  })

  it('should call openConfirmDialog when action button is clicked', () => {
    render(<NonPinnedWarning />)

    fireEvent.click(screen.getByText('Trust this Safe'))

    expect(mockOpenConfirmDialog).toHaveBeenCalled()
  })

  it('should not show dismiss button (ActionCard pattern)', () => {
    render(<NonPinnedWarning />)

    expect(screen.queryByLabelText('dismiss')).not.toBeInTheDocument()
  })

  it('should track analytics event when warning shows', () => {
    render(<NonPinnedWarning />)

    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'Show untrusted Safe warning',
      }),
    )
  })

  it('should show confirmation dialog when isConfirmDialogOpen is true', () => {
    mockUseNonPinnedSafeWarning.mockReturnValue({
      ...defaultHookReturn,
      isConfirmDialogOpen: true,
    })

    render(<NonPinnedWarning />)

    expect(screen.getByTestId('add-trusted-safe-dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirm trusted Safe')).toBeInTheDocument()
  })

  it('should show similar address warning in dialog when hasSimilarAddress is true', () => {
    const similarAddresses = [{ address: '0x1234567890123456789012345678901234567891', name: 'Similar Safe' }]
    mockUseNonPinnedSafeWarning.mockReturnValue({
      ...defaultHookReturn,
      isConfirmDialogOpen: true,
      hasSimilarAddress: true,
      similarAddresses,
    })

    render(<NonPinnedWarning />)

    expect(screen.getByText('Similar address detected')).toBeInTheDocument()
    expect(screen.getByText(/address poisoning attack/i)).toBeInTheDocument()
    expect(screen.getByText('I understand, add anyway')).toBeInTheDocument()
    expect(screen.getByText('Similar Safe in your account')).toBeInTheDocument()
  })

  it('should call confirmAndAddToPinnedList when confirm button is clicked in dialog', async () => {
    mockUseNonPinnedSafeWarning.mockReturnValue({
      ...defaultHookReturn,
      isConfirmDialogOpen: true,
    })

    render(<NonPinnedWarning />)

    const confirmButton = screen.getByTestId('confirm-add-trusted-safe-button')
    fireEvent.submit(confirmButton)

    await waitFor(() => {
      expect(mockConfirmAndAddToPinnedList).toHaveBeenCalled()
    })
  })

  it('should call closeConfirmDialog when cancel button is clicked in dialog', () => {
    mockUseNonPinnedSafeWarning.mockReturnValue({
      ...defaultHookReturn,
      isConfirmDialogOpen: true,
    })

    render(<NonPinnedWarning />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockCloseConfirmDialog).toHaveBeenCalled()
  })
})
