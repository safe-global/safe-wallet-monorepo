import { render } from '@/tests/test-utils'
import ErrorDetails from '..'

describe('ErrorDetails', () => {
  it('renders the support reference fields', () => {
    const { getByText, getByTestId } = render(
      <ErrorDetails
        reference={{
          code: 'GS013',
          txHash: '0x1234567890abcdef1234567890abcdef12345678',
          network: 'Sepolia',
          timestamp: '2026-08-10T12:00:00.000Z',
        }}
      />,
    )

    expect(getByTestId('error-details')).toBeInTheDocument()
    expect(getByText('GS013')).toBeInTheDocument()
    expect(getByText('Sepolia')).toBeInTheDocument()
    // Hash is shortened, never shown in full
    expect(getByText('0x123456…345678')).toBeInTheDocument()
  })

  it('omits optional rows when absent', () => {
    const { queryByText } = render(
      <ErrorDetails reference={{ code: 'UNKNOWN', timestamp: '2026-08-10T12:00:00.000Z' }} />,
    )

    expect(queryByText('Transaction')).not.toBeInTheDocument()
    expect(queryByText('Network')).not.toBeInTheDocument()
    expect(queryByText('UNKNOWN')).toBeInTheDocument()
  })
})
