import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData/index'
import { render } from '@/tests/test-utils'

describe('DecodedData', () => {
  it('returns null if txData and toInfo are missing', () => {
    const { container } = render(<DecodedData txData={undefined} toInfo={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows an Interact with block if there is no txData but toInfo', () => {
    const { getByText } = render(<DecodedData txData={undefined} toInfo={{ value: '0x123' }} />)

    expect(getByText('Interact with:')).toBeInTheDocument()
  })

  it('shows Hex encoded data if there are no parameters', () => {
    const mockTxData = {
      to: {
        value: '0x874E2190e6B10f5173F00E27E6D5D9F90b7664C4',
      },
      value: '0',
      operation: 0,
      dataDecoded: {
        method: 'fallback',
        parameters: [],
      },
      hexData:
        '0x895a74850000000000000000000000000000000000000000000004bb752b4d22ab390000000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000001f76adba2311f154678f5e5605db5c9c2',
      trustedDelegateCallTarget: false,
    }

    const { getByText } = render(<DecodedData txData={mockTxData} toInfo={{ value: '0x123' }} />)

    expect(getByText('No parameters')).toBeInTheDocument()
    expect(getByText('Data:')).toBeInTheDocument()
  })

  it('does not show Hex encoded data if there is none', () => {
    const mockTxData = {
      to: {
        value: '0x874E2190e6B10f5173F00E27E6D5D9F90b7664C4',
      },
      value: '0',
      operation: 0,
      dataDecoded: {
        method: 'mint',
        parameters: [],
      },
      hexData: '',
      trustedDelegateCallTarget: false,
    }

    const { getByText, queryByText } = render(<DecodedData txData={mockTxData} toInfo={{ value: '0x123' }} />)

    expect(getByText('No parameters')).toBeInTheDocument()
    expect(queryByText('Data:')).not.toBeInTheDocument()
  })

  it('only shows Hex encoded data if no decodedData exists', () => {
    const mockTxData = {
      to: {
        value: '0x874E2190e6B10f5173F00E27E6D5D9F90b7664C4',
      },
      value: '0',
      operation: 0,
      hexData:
        '0x895a74850000000000000000000000000000000000000000000004bb752b4d22ab390000000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000001f76adba2311f154678f5e5605db5c9c2',
      trustedDelegateCallTarget: false,
    }

    const { getByText, queryByText } = render(<DecodedData txData={mockTxData} toInfo={{ value: '0x123' }} />)

    expect(queryByText('No parameters')).not.toBeInTheDocument()
    expect(getByText('Data:')).toBeInTheDocument()
  })
})
