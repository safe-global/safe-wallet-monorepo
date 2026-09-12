import { render } from '@/src/tests/test-utils'
import { CONTRACT_ERROR_FALLBACK } from '@safe-global/utils/services/exceptions/contractErrors'
import { ExecuteError } from './ExecuteError'

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))

describe('ExecuteError', () => {
  it('renders the support reference the shared copy points at', () => {
    const { getByText } = render(<ExecuteError description={CONTRACT_ERROR_FALLBACK} reference="GS013" />)

    expect(getByText(CONTRACT_ERROR_FALLBACK)).toBeTruthy()
    // "…contact support with the reference below" is only true if it is below.
    expect(getByText(/Reference: GS013/)).toBeTruthy()
  })

  it('renders no reference row when there is no code to show', () => {
    const { queryByTestId } = render(
      <ExecuteError description="Something went wrong. Try again, or contact support." />,
    )

    expect(queryByTestId('execution-error-reference')).toBeNull()
  })
})
