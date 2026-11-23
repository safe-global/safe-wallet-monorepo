import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { readPreviousFallbackHandler } from '@/features/policy-guard/public/services/previousFallbackHandler'
import { usePreviousFallbackHandler } from '../usePreviousFallbackHandler'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/features/policy-guard/public/services/previousFallbackHandler', () => ({
  readPreviousFallbackHandler: jest.fn(),
}))

const SAFE = faker.finance.ethereumAddress()
const TOKEN_CALLBACK_HANDLER = '0x54e86d004d71a8D2112ec75FaCE57D730b0433F3'
const COMPATIBILITY_HANDLER_1_5_0 = '0x3EfCBb83A4A7AfcB4F68D501E2c2203a38be77f4'
const provider = {}

describe('usePreviousFallbackHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useSafeScope).mockReturnValue({
      chainId: '11155111',
      safeAddress: SAFE,
      scopeKey: `11155111:${SAFE}`,
      safeLoaded: true,
      safeLoading: false,
      web3ReadOnly: provider,
      safe: { version: '1.5.0+L2' },
    } as unknown as ReturnType<typeof useSafeScope>)
  })

  it('should return the handler from before the setup, when the Safe events tell it', async () => {
    const previous = faker.finance.ethereumAddress()
    jest.mocked(readPreviousFallbackHandler).mockResolvedValue(previous)

    const { result } = renderHook(() => usePreviousFallbackHandler())

    await waitFor(() => expect(result.current).toEqual({ address: previous, isDefault: false }))
    expect(readPreviousFallbackHandler).toHaveBeenCalledWith(provider, SAFE, TOKEN_CALLBACK_HANDLER)
  })

  it('should return the default handler of the Safe version, when the events cannot be read', async () => {
    jest.mocked(readPreviousFallbackHandler).mockRejectedValue(new Error('block range too large'))

    const { result } = renderHook(() => usePreviousFallbackHandler())

    await waitFor(() => expect(result.current).toEqual({ address: COMPATIBILITY_HANDLER_1_5_0, isDefault: true }))
  })

  it('should return the default handler of the Safe version, when the Safe never changed to the TokenCallbackHandler', async () => {
    jest.mocked(readPreviousFallbackHandler).mockResolvedValue(undefined)

    const { result } = renderHook(() => usePreviousFallbackHandler())

    await waitFor(() => expect(result.current).toEqual({ address: COMPATIBILITY_HANDLER_1_5_0, isDefault: true }))
  })

  it('should return nothing, while the events are read', () => {
    jest.mocked(readPreviousFallbackHandler).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => usePreviousFallbackHandler())

    expect(result.current).toBeUndefined()
  })
})
