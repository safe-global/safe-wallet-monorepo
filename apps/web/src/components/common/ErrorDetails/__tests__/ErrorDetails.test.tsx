import { render } from '@/tests/test-utils'
import ErrorDetails from '..'

describe('ErrorDetails', () => {
  it('renders only the error code', () => {
    const { getByTestId, getByText } = render(<ErrorDetails code="GS013" />)

    expect(getByTestId('error-details')).toBeInTheDocument()
    expect(getByText('Error code')).toBeInTheDocument()
    expect(getByText('GS013')).toBeInTheDocument()
  })

  it('names a decoded custom error and its source', () => {
    const { getByText } = render(
      <ErrorDetails
        code="GS013"
        customError={{ selector: '0x70cc6907', name: 'UnapprovedHash', source: 'Hypernative guard' }}
      />,
    )

    expect(getByText(/GS013 · UnapprovedHash \(Hypernative guard\)/)).toBeInTheDocument()
  })

  it('shows the raw selector for an undecodable custom error', () => {
    const { getByText } = render(<ErrorDetails code="GS013" customError={{ selector: '0xdeadbeef' }} />)

    expect(getByText(/GS013 · 0xdeadbeef/)).toBeInTheDocument()
  })
})
