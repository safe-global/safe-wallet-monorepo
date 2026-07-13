import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import TxNote from '..'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'

jest.mock('@/hooks/useIsSafeOwner')

const mockUseIsSafeOwner = useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>

const txDetailsWithNote = {
  note: 'Monthly payroll',
  detailedExecutionInfo: undefined,
} as unknown as TransactionDetails

describe('TxNote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the note for a signer of the Safe', () => {
    mockUseIsSafeOwner.mockReturnValue(true)

    render(<TxNote txDetails={txDetailsWithNote} />)

    expect(screen.getByTestId('tx-note')).toHaveTextContent('Monthly payroll')
  })

  it('hides the note for a non-signer', () => {
    mockUseIsSafeOwner.mockReturnValue(false)

    render(<TxNote txDetails={txDetailsWithNote} />)

    expect(screen.queryByTestId('tx-note')).not.toBeInTheDocument()
  })

  it('renders nothing when there is no note, even for a signer', () => {
    mockUseIsSafeOwner.mockReturnValue(true)

    const { container } = render(<TxNote txDetails={{ note: null } as unknown as TransactionDetails} />)

    expect(container).toBeEmptyDOMElement()
  })
})
