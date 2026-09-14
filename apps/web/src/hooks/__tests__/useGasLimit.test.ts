import { mockWeb3Provider, renderHook, waitFor } from '@/tests/test-utils'
import useGasLimit from '../useGasLimit'
import * as safeCoreSDK from '../coreSDK/safeCoreSDK'
import * as useWallet from '../wallets/useWallet'
import * as useSafeInfo from '../useSafeInfo'
import * as useIsSafeOwner from '../useIsSafeOwner'

import { mockContractManager } from '@/tests/mocks/contractManager'
import type Safe from '@safe-global/protocol-kit'
import { faker } from '@faker-js/faker'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { createMockSafeTransaction } from '@/tests/transactions'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { type JsonRpcProvider, zeroPadValue } from 'ethers'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit'
import { Errors } from '@/services/exceptions'
import { BaseError } from 'viem'

const mockLogError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: (...args: unknown[]) => mockLogError(...args),
}))

const contractManager = mockContractManager()

const walletAddress = faker.finance.ethereumAddress()
const prevSignerAddress = faker.finance.ethereumAddress()

const safeInfo = safeInfoBuilder().with({ threshold: 1 }).build()
let mockWeb3: JsonRpcProvider
const rejectEstimate = (error: unknown) => {
  ;(mockWeb3.estimateGas as jest.Mock).mockRejectedValue(error)
}

describe('useGasLimit', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(safeCoreSDK, 'useSafeSDK').mockReturnValue({
      getContractManager: () => contractManager,
    } as unknown as Safe)

    jest
      .spyOn(useWallet, 'useSigner')
      .mockReturnValue(connectedWalletBuilder().with({ address: walletAddress }).build())
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: { ...safeInfo, deployed: true },
      safeAddress: safeInfo.address.value,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValue(true)
    mockWeb3 = mockWeb3Provider([])
  })
  it('should return undefined for undefined safeTx', async () => {
    const { result } = renderHook(() => useGasLimit())
    await waitFor(async () => {
      expect(result.current).toEqual({ gasLimit: undefined, gasLimitLoading: false, gasLimitError: undefined })
    })
  })

  it('should return undefined if no owner is connected', async () => {
    jest.spyOn(useWallet, 'useSigner').mockReturnValue(
      connectedWalletBuilder()
        .with({
          address: undefined,
        })
        .build(),
    )

    const safeTx = createMockSafeTransaction({
      data: '0x00',
      to: faker.finance.ethereumAddress(),
    })

    const { result } = renderHook(() => useGasLimit(safeTx))
    await waitFor(async () => {
      expect(result.current).toEqual({ gasLimit: undefined, gasLimitLoading: false, gasLimitError: undefined })
    })
  })

  it('should return estimated gas', async () => {
    const safeTx = createMockSafeTransaction({
      data: '0x00',
      to: faker.finance.ethereumAddress(),
    })

    const { result } = renderHook(() => useGasLimit(safeTx))
    await waitFor(async () => {
      expect(result.current).toEqual({ gasLimit: 50_000n, gasLimitLoading: false, gasLimitError: undefined })
    })
  })

  it('should not modify the signature if fully signed', async () => {
    const safeTx = createMockSafeTransaction({
      data: '0x00',
      to: faker.finance.ethereumAddress(),
    })

    safeTx.addSignature({
      signer: prevSignerAddress,
      data: zeroPadValue('0x1234', 32),
      isContractSignature: false,
      dynamicPart: () => '',
      staticPart: () => zeroPadValue('0x1234', 32),
    })

    const expectedCallData = Gnosis_safe__factory.createInterface().encodeFunctionData('execTransaction', [
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      safeTx.data.safeTxGas,
      safeTx.data.baseGas,
      safeTx.data.gasPrice,
      safeTx.data.gasToken,
      safeTx.data.refundReceiver,
      safeTx.encodedSignatures(),
    ])

    const { result } = renderHook(() => useGasLimit(safeTx))
    await waitFor(async () => {
      expect(result.current).toEqual({ gasLimit: 50_000n, gasLimitLoading: false, gasLimitError: undefined })
    })
    expect(mockWeb3.estimateGas).toHaveBeenCalledWith({
      to: safeInfo.address.value,
      from: walletAddress,
      data: expectedCallData,
    })
  })

  it('should add a prevalidated signature if a signature is missing', async () => {
    const safeTx = createMockSafeTransaction({
      data: '0x00',
      to: faker.finance.ethereumAddress(),
    })
    const prevalidatedSignature = generatePreValidatedSignature(walletAddress)
    const expectedCallData = Gnosis_safe__factory.createInterface().encodeFunctionData('execTransaction', [
      safeTx.data.to,
      safeTx.data.value,
      safeTx.data.data,
      safeTx.data.operation,
      safeTx.data.safeTxGas,
      safeTx.data.baseGas,
      safeTx.data.gasPrice,
      safeTx.data.gasToken,
      safeTx.data.refundReceiver,
      prevalidatedSignature.staticPart(),
    ])

    const { result } = renderHook(() => useGasLimit(safeTx))
    await waitFor(async () => {
      expect(result.current).toEqual({ gasLimit: 50_000n, gasLimitLoading: false, gasLimitError: undefined })
    })
    expect(mockWeb3.estimateGas).toHaveBeenCalledWith({
      to: safeInfo.address.value,
      from: walletAddress,
      data: expectedCallData,
    })
  })

  describe('error logging', () => {
    it('does not log a revert — the node answered, and the UI maps the GS code', async () => {
      // WA-3252 review: estimating an unsigned or failing Safe tx reverts as a
      // matter of course. Logging every one of those buries real RPC faults.
      rejectEstimate(Object.assign(new Error('execution reverted: "GS013"'), { code: 'CALL_EXCEPTION' }))

      const safeTx = createMockSafeTransaction({ data: '0x00', to: faker.finance.ethereumAddress() })
      const { result } = renderHook(() => useGasLimit(safeTx))

      await waitFor(() => expect(result.current.gasLimitError).toBeDefined())
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('does not log a transient throttle — viem already retried it', async () => {
      const inner = Object.assign(new BaseError('inner'), { code: -32005 })
      rejectEstimate(new BaseError('outer', { cause: inner }))

      const safeTx = createMockSafeTransaction({ data: '0x00', to: faker.finance.ethereumAddress() })
      const { result } = renderHook(() => useGasLimit(safeTx))

      await waitFor(() => expect(result.current.gasLimitError).toBeDefined())
      expect(mockLogError).not.toHaveBeenCalled()
    })

    it('still logs a genuine RPC failure as 612', async () => {
      rejectEstimate(new Error('HTTP request failed. Status: 500'))

      const safeTx = createMockSafeTransaction({ data: '0x00', to: faker.finance.ethereumAddress() })
      const { result } = renderHook(() => useGasLimit(safeTx))

      await waitFor(() => expect(result.current.gasLimitError).toBeDefined())
      expect(mockLogError).toHaveBeenCalledWith(Errors._612, 'HTTP request failed. Status: 500', expect.anything())
    })
  })
})
