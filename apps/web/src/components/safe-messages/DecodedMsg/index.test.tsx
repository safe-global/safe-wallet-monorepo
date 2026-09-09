import { render } from '@/tests/test-utils'
import { normalizeTypedData } from '@safe-global/utils/utils/web3'
import { DecodedMsg } from '.'

jest.mock('@safe-global/utils/utils/web3', () => ({
  ...jest.requireActual('@safe-global/utils/utils/web3'),
  normalizeTypedData: jest.fn(),
}))

const mockedNormalizeTypedData = normalizeTypedData as jest.MockedFunction<typeof normalizeTypedData>

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
    mockedNormalizeTypedData.mockReturnValue(typedMessage as never)
  })

  it('normalizes a typed message once, however often the details panel re-renders', () => {
    const { rerender } = render(<DecodedMsg message={typedMessage as never} />)

    rerender(<DecodedMsg message={typedMessage as never} />)
    rerender(<DecodedMsg message={typedMessage as never} isInModal />)

    expect(mockedNormalizeTypedData).toHaveBeenCalledTimes(1)
  })

  it('does not normalize a plain text message', () => {
    render(<DecodedMsg message="hello" />)

    expect(mockedNormalizeTypedData).not.toHaveBeenCalled()
  })
})
