import { render } from '@/tests/test-utils'
import ErrorDetails from '..'

describe('ErrorDetails', () => {
  it('renders only the error code', () => {
    const { getByTestId, getByText } = render(<ErrorDetails code="GS013" />)

    expect(getByTestId('error-details')).toBeInTheDocument()
    expect(getByText('Error code')).toBeInTheDocument()
    expect(getByText('GS013')).toBeInTheDocument()
  })
})
