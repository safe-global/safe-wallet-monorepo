import { render } from '@/tests/test-utils'
import { mockCurrentChain } from '@/tests/mocks/hooks'
import { getCouldNotCheckMessage } from '@/components/tx/TxCheckError'
import { COULD_NOT_SUBMIT_RETRY_MESSAGE } from '@/components/tx/TxSubmitError'
import { RecoveryListItemContext } from '@safe-global/views/features/recovery/components/RecoveryListItem/RecoveryListItemContext'
import RecoveryValidationErrors from '.'
import { useIsValidRecoveryExecuteNextTx, useIsValidRecoverySkipExpired } from '../../hooks/useIsValidRecoveryExecution'
import { seedRecoveryScenario } from '../../test-helpers'

jest.mock('../../hooks/useIsValidRecoveryExecution')
jest.mock('@/hooks/useChains')

const CHECK_ERROR_TEXT = getCouldNotCheckMessage('Sepolia')

const renderErrors = (submitError?: Error) => {
  const item = seedRecoveryScenario('executable')

  return render(
    <RecoveryListItemContext.Provider value={{ submitError, setSubmitError: jest.fn() }}>
      <RecoveryValidationErrors item={item} />
    </RecoveryListItemContext.Provider>,
  )
}

const mockCheckErrors = ({ executeNextTx, skipExpired }: { executeNextTx?: Error; skipExpired?: Error }) => {
  jest.mocked(useIsValidRecoveryExecuteNextTx).mockReturnValue([undefined, executeNextTx, false])
  jest.mocked(useIsValidRecoverySkipExpired).mockReturnValue([undefined, skipExpired, false])
}

describe('RecoveryValidationErrors', () => {
  beforeEach(() => {
    mockCurrentChain({ chainName: 'Sepolia' })
  })

  it('renders nothing while the checks pass and nothing failed to submit', () => {
    mockCheckErrors({})

    const { container } = renderErrors()

    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    ['executing the next transaction', { executeNextTx: new Error('timeout') }],
    ['cancelling the expired transaction', { skipExpired: new Error('timeout') }],
  ])('shows the check error from %s', (_, checkErrors) => {
    mockCheckErrors(checkErrors)

    const { getByText, queryByText } = renderErrors()

    expect(getByText(CHECK_ERROR_TEXT)).toBeInTheDocument()
    expect(queryByText(COULD_NOT_SUBMIT_RETRY_MESSAGE)).not.toBeInTheDocument()
  })

  it('shows the submit error', () => {
    mockCheckErrors({})

    const { getByText, queryByText } = renderErrors(new Error('timeout'))

    expect(getByText(COULD_NOT_SUBMIT_RETRY_MESSAGE)).toBeInTheDocument()
    expect(queryByText(CHECK_ERROR_TEXT)).not.toBeInTheDocument()
  })

  it('shows the check error and the submit error together', () => {
    mockCheckErrors({ executeNextTx: new Error('timeout') })

    const { getByText } = renderErrors(new Error('timeout'))

    expect(getByText(CHECK_ERROR_TEXT)).toBeInTheDocument()
    expect(getByText(COULD_NOT_SUBMIT_RETRY_MESSAGE)).toBeInTheDocument()
  })
})
