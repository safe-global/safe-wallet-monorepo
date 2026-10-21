import { getDefaultNormalizer, render, screen } from '@/tests/test-utils'
import { normalizeTypedData } from '@safe-global/utils/utils/web3'
import type * as Web3Utils from '@safe-global/utils/utils/web3'
import { nestedTypedData, nestedTypedDataValue } from '@/tests/builders/safeMessage'
import * as wallets from '@/utils/wallets'
import { DecodedMsg } from '.'

jest.mock('@safe-global/utils/utils/web3', () => ({
  ...jest.requireActual('@safe-global/utils/utils/web3'),
  normalizeTypedData: jest.fn(),
}))

const mockedNormalizeTypedData = normalizeTypedData as jest.MockedFunction<typeof normalizeTypedData>
const { normalizeTypedData: realNormalizeTypedData } = jest.requireActual<typeof Web3Utils>(
  '@safe-global/utils/utils/web3',
)

const KEEP_WHITESPACE = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) }

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

  describe('with the real typed data normalization', () => {
    beforeEach(() => {
      mockedNormalizeTypedData.mockImplementation(realNormalizeTypedData)
      jest.spyOn(wallets, 'isSmartContract').mockResolvedValue(false)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('shows the domain with a decimal chain id', async () => {
      render(<DecodedMsg message={nestedTypedData} />)

      expect(await screen.findByText('EIP712Domain')).toBeInTheDocument()
      expect(screen.getByText('name(string)')).toBeInTheDocument()
      expect(screen.getByText('EIP-1271 Example DApp')).toBeInTheDocument()
      expect(screen.getByText('chainId(uint256)')).toBeInTheDocument()
      expect(screen.getByText('11155111')).toBeInTheDocument()
    })

    it('shows a nested object as JSON', async () => {
      render(<DecodedMsg message={nestedTypedData} />)

      expect(await screen.findByText('testNested(Nested)')).toBeInTheDocument()
      expect(screen.getByText(JSON.stringify(nestedTypedDataValue, null, 2), KEEP_WHITESPACE)).toBeInTheDocument()
    })

    it('shows a nested array as JSON', async () => {
      const nestedArray = [nestedTypedDataValue, nestedTypedDataValue]
      render(<DecodedMsg message={nestedTypedData} />)

      expect(await screen.findByText('testNestedArray(Nested[])')).toBeInTheDocument()
      expect(screen.getByText(JSON.stringify(nestedArray, null, 2), KEEP_WHITESPACE)).toBeInTheDocument()
    })
  })
})
