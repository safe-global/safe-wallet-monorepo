import { normalizeTypedData } from '@safe-global/utils/utils/web3'
import { Errors, logError } from '@/services/exceptions'
import { normalizeMessageForDisplay } from '../normalizeMessage'

jest.mock('@safe-global/utils/utils/web3', () => ({
  ...jest.requireActual('@safe-global/utils/utils/web3'),
  normalizeTypedData: jest.fn(),
}))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockedNormalizeTypedData = normalizeTypedData as jest.MockedFunction<typeof normalizeTypedData>

const typedMessage = {
  domain: { name: 'Safe', chainId: '1' },
  types: { EIP712Domain: [{ name: 'name', type: 'string' }], Msg: [{ name: 'value', type: 'string' }] },
  primaryType: 'Msg',
  message: { value: 'hello' },
}

describe('normalizeMessageForDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the normalized message', () => {
    const normalized = { ...typedMessage, domain: { ...typedMessage.domain, chainId: 1 } }
    mockedNormalizeTypedData.mockReturnValue(normalized as never)

    expect(normalizeMessageForDisplay(typedMessage as never)).toBe(normalized)
    expect(logError).not.toHaveBeenCalled()
  })

  it('reports a message it cannot normalize and falls back to the raw message', () => {
    const error = new Error('Unsupported type')
    mockedNormalizeTypedData.mockImplementation(() => {
      throw error
    })

    expect(normalizeMessageForDisplay(typedMessage as never)).toBe(typedMessage)
    expect(logError).toHaveBeenCalledWith(Errors._809, error)
  })
})
