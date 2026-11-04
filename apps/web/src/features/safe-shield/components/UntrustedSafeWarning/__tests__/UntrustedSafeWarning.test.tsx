import { fireEvent, screen, waitFor } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { Severity, SafeStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { RootState } from '@/store'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as analytics from '@/services/analytics'
import UntrustedSafeWarning from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const safe = extendedSafeInfoBuilder().build()
const safeAddress = safe.address.value

const safeAnalysis: SafeAnalysisResult = {
  severity: Severity.CRITICAL,
  type: SafeStatus.UNTRUSTED,
  title: 'Not in your accounts',
  description: "You're creating a transaction from a Safe that isn't in your accounts. Add it if you recognize it.",
}

const addressBookState = {
  addressBook: { [safe.chainId]: { [safeAddress]: 'Treasury' } },
} as unknown as Partial<RootState>

const renderWarning = (onAddToTrustedList = jest.fn()) => {
  render(<UntrustedSafeWarning safeAnalysis={safeAnalysis} onAddToTrustedList={onAddToTrustedList} />, {
    initialReduxState: addressBookState,
  })
  return onAddToTrustedList
}

describe('UntrustedSafeWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe,
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  it('renders the analysis title, description and the call to action', () => {
    renderWarning()

    expect(screen.getByTestId('untrusted-safe-warning')).toBeInTheDocument()
    expect(screen.getByText(safeAnalysis.title)).toBeInTheDocument()
    expect(screen.getByText(safeAnalysis.description)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to my accounts' })).toBeInTheDocument()
  })

  it('opens the confirmation dialog and tracks the click', async () => {
    renderWarning()

    fireEvent.click(screen.getByRole('button', { name: 'Add to my accounts' }))

    await waitFor(() => {
      expect(screen.getByTestId('add-trusted-safe-dialog')).toBeInTheDocument()
    })
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ label: analytics.TRUSTED_SAFE_LABELS.safe_shield }),
    )
  })

  it('prefills the address book name and adds the Safe on confirm', async () => {
    const onAddToTrustedList = renderWarning()

    fireEvent.click(screen.getByRole('button', { name: 'Add to my accounts' }))
    await waitFor(() => expect(screen.getByTestId('safe-name-input')).toBeInTheDocument())
    expect(screen.getByTestId('safe-name-input')).toHaveValue('Treasury')

    fireEvent.click(screen.getByTestId('confirm-add-trusted-safe-button'))

    await waitFor(() => expect(onAddToTrustedList).toHaveBeenCalled())
    expect(screen.queryByTestId('add-trusted-safe-dialog')).not.toBeInTheDocument()
  })

  it('does not render the dialog when there is no Safe to add', () => {
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe,
      safeAddress: '',
      safeLoaded: false,
      safeLoading: false,
      safeError: undefined,
    })
    renderWarning()

    fireEvent.click(screen.getByRole('button', { name: 'Add to my accounts' }))

    expect(screen.queryByTestId('add-trusted-safe-dialog')).not.toBeInTheDocument()
  })
})
