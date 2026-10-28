import { faker } from '@faker-js/faker'
import { getCompatibilityFallbackHandlerDeployment } from '@safe-global/safe-deployments'
import { renderHook } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { basicTypesActions, multiSendTxDataBuilder, setFallbackHandlerAction } from '@/tests/builders/dataDecoded'
import { transactionDataBuilder } from '@/tests/builders/transactionDetails'
import { useTWAPFallbackHandlerAddress } from '@/features/swap'
// Imported directly from helpers to avoid circular deps in tests
import { TWAP_FALLBACK_HANDLER } from '@/features/swap/helpers/utils'
import { useSetsUntrustedFallbackHandler } from './UntrustedFallbackHandlerTxAlert'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/swap', () => ({
  useTWAPFallbackHandlerAddress: jest.fn(),
}))

const OFFICIAL_HANDLER = getCompatibilityFallbackHandlerDeployment({ network: '1', version: '1.4.1' })?.defaultAddress!

const singleCallSetting = (handler: string) =>
  transactionDataBuilder()
    .with({ dataDecoded: setFallbackHandlerAction(handler).dataDecoded })
    .build()

const batchSetting = (handler: string) =>
  multiSendTxDataBuilder([...basicTypesActions(), setFallbackHandlerAction(handler)]).build()

describe('useSetsUntrustedFallbackHandler', () => {
  beforeEach(() => {
    mockSafeInfo({ chainId: '1' })
    jest.mocked(useTWAPFallbackHandlerAddress).mockReturnValue(TWAP_FALLBACK_HANDLER)
  })

  it('returns true when a single call sets an unofficial fallback handler', () => {
    const txData = singleCallSetting(faker.finance.ethereumAddress())

    const { result } = renderHook(() => useSetsUntrustedFallbackHandler(txData))

    expect(result.current).toBe(true)
  })

  it('returns false when a single call sets the official 1.4.1 fallback handler', () => {
    const txData = singleCallSetting(OFFICIAL_HANDLER)

    const { result } = renderHook(() => useSetsUntrustedFallbackHandler(txData))

    expect(result.current).toBe(false)
  })

  it('returns true when one action of a multiSend sets an unofficial fallback handler', () => {
    const txData = batchSetting(faker.finance.ethereumAddress())

    const { result } = renderHook(() => useSetsUntrustedFallbackHandler(txData))

    expect(result.current).toBe(true)
  })

  it('returns false when a multiSend sets the official 1.4.1 fallback handler', () => {
    const txData = batchSetting(OFFICIAL_HANDLER)

    const { result } = renderHook(() => useSetsUntrustedFallbackHandler(txData))

    expect(result.current).toBe(false)
  })

  it('returns false when a multiSend sets the TWAP fallback handler', () => {
    const txData = batchSetting(TWAP_FALLBACK_HANDLER)

    const { result } = renderHook(() => useSetsUntrustedFallbackHandler(txData))

    expect(result.current).toBe(false)
  })

  it("returns false when no action sets a fallback handler, even if the Safe's own handler is unofficial", () => {
    mockSafeInfo({ chainId: '1', fallbackHandler: { value: faker.finance.ethereumAddress() } })
    const txData = multiSendTxDataBuilder().build()

    const { result } = renderHook(() => useSetsUntrustedFallbackHandler(txData))

    expect(result.current).toBe(false)
  })
})
