import { skipToken } from '@reduxjs/toolkit/query'

import { renderHook } from '@/tests/test-utils'
import { useGtfFeePreview } from '../useGtfFeePreview'
import { resolveFeeParams } from '../../services/resolveFeeParams'
import * as gatewayApi from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { createSafeTx } from '@/tests/builders/safeTx'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { AppDispatch } from '@/store'

const mockChain = chainBuilder()
  .with({
    chainId: '1',
    features: [FEATURES.GTF],
    relayer: {
      type: 'RELAY_FEE',
      safeCreationSponsored: false,
      safeTransactionSponsored: false,
      enableTenderlySimulationBeforeRelay: false,
    },
  })
  .build()

const SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'
const GAS_TOKEN = '0x0000000000000000000000000000000000000000'

const safeTx = createSafeTx()

const capturePreviewArg = (safenetCheck: boolean) => {
  const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>)

  renderHook(() =>
    useGtfFeePreview({
      enabled: true,
      safeTx,
      chain: mockChain,
      safeAddress: SAFE_ADDRESS,
      gasToken: GAS_TOKEN,
      numberSignatures: 2,
      safenetCheck,
    }),
  )

  const arg = spy.mock.calls.at(-1)?.[0]
  if (arg === skipToken || arg === undefined) throw new Error('preview query was skipped')
  return arg
}

// The sign-time refetch goes through the imperative `initiate`, not the hook. Reject the
// thunk so only the arg matters — nothing downstream of the quote is under test here.
const captureSignTimeArg = async (safenetCheck: boolean) => {
  const initiate = jest
    .spyOn(gatewayApi.gatewayApi.endpoints.getGtfFeePreview, 'initiate')
    .mockReturnValue({ unwrap: () => Promise.reject(new Error('stop')) } as never)
  const dispatch = jest.fn((thunk) => thunk) as unknown as AppDispatch

  await expect(
    resolveFeeParams({
      chainId: '1',
      safeAddress: SAFE_ADDRESS,
      safeTx,
      gasToken: GAS_TOKEN,
      numberSignatures: 2,
      currency: 'usd',
      safenetCheck,
      dispatch,
    }),
  ).rejects.toThrow('stop')

  return initiate.mock.calls.at(-1)?.[0]
}

describe('useGtfFeePreview', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('omits safenetCheck from the request when the user has not opted in', () => {
    expect(capturePreviewArg(false).tx).not.toHaveProperty('safenetCheck')
  })

  it('sends safenetCheck: true when the user opts in', () => {
    expect(capturePreviewArg(true).tx.safenetCheck).toBe(true)
  })

  it('varies the request payload with the opt-in, so RTK caches the two quotes apart', () => {
    expect(capturePreviewArg(true).tx).not.toEqual(capturePreviewArg(false).tx)
  })

  describe('preview/sign-time payload parity', () => {
    // The quote is folded into the signed fee fields. If these two payloads ever diverge,
    // the user signs a `safeTxHash` for a fee they never saw.
    it.each([true, false])('builds an identical payload on both paths (opt-in: %s)', async (safenetCheck) => {
      const previewArg = capturePreviewArg(safenetCheck)
      const signTimeArg = await captureSignTimeArg(safenetCheck)

      expect(signTimeArg).toEqual(previewArg)
    })
  })
})
