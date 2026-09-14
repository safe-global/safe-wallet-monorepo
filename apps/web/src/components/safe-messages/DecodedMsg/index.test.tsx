import { render } from '@/tests/test-utils'
import { normalizeTypedData } from '@safe-global/utils/utils/web3'
import { Errors, logError } from '@/services/exceptions'
import { DecodedMsg } from '.'

jest.mock('@safe-global/utils/utils/web3', () => ({
  ...jest.requireActual('@safe-global/utils/utils/web3'),
  normalizeTypedData: jest.fn(),
}))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedNormalizeTypedData = normalizeTypedData as jest.MockedFunction<typeof normalizeTypedData>
const mockedLogError = logError as jest.MockedFunction<typeof logError>

const typedMessage = {
  domain: { name: 'Safe', chainId: '1' },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ],
    Msg: [{ name: 'value', type: 'string' }],
  },
  primaryType: 'Msg',
  message: { value: 'hello' },
}

describe('DecodedMsg', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reports a message it cannot normalize', () => {
    mockedNormalizeTypedData.mockImplementation(() => {
      throw new Error('Unsupported type')
    })

    render(<DecodedMsg message={typedMessage as never} />)

    expect(mockedLogError).toHaveBeenCalledTimes(1)
    expect(mockedLogError).toHaveBeenCalledWith(Errors._809, expect.any(Error), undefined)
  })

  it('reports it once, however often the details panel re-renders', () => {
    // The regression: normalizing in the render body re-threw — and re-reported —
    // on every re-render for as long as the message stayed on screen.
    mockedNormalizeTypedData.mockImplementation(() => {
      throw new Error('Unsupported type')
    })

    const { rerender } = render(<DecodedMsg message={typedMessage as never} />)

    rerender(<DecodedMsg message={typedMessage as never} />)
    rerender(<DecodedMsg message={typedMessage as never} isInModal />)

    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('reports nothing for a message it can normalize', () => {
    mockedNormalizeTypedData.mockReturnValue(typedMessage as never)

    const { rerender } = render(<DecodedMsg message={typedMessage as never} />)
    rerender(<DecodedMsg message={typedMessage as never} />)

    expect(mockedLogError).not.toHaveBeenCalled()
  })

  it('reports nothing for a plain text message', () => {
    render(<DecodedMsg message="hello" />)

    expect(mockedNormalizeTypedData).not.toHaveBeenCalled()
    expect(mockedLogError).not.toHaveBeenCalled()
  })
})
