import type { SafeContractImplementationType } from '@safe-global/protocol-kit'
import type { SafeTransaction, SafeSignature } from '@safe-global/types-kit'
import * as useWallet from '@/hooks/wallets/useWallet'
import { act, renderHook } from '@/tests/test-utils'
import useIsValidExecution from '../../../../hooks/useIsValidExecution'
import type { EthersError } from '@/utils/ethers-utils'
import type { EthersTxReplacedReason } from '@/utils/ethers-utils'
import * as web3 from '@/hooks/wallets/web3'
import type { Eip1193Provider } from 'ethers'
import { JsonRpcProvider, BrowserProvider } from 'ethers'
import * as contracts from '@/services/contracts/safeContracts'
import * as balancesHook from '@/hooks/useBalances'
import type { UseBalancesResult } from '@/hooks/useBalances'
import { initialBalancesState } from '@safe-global/utils/hooks/portfolioBalances'
import { CONTRACT_ERROR_FALLBACK } from '@safe-global/utils/services/exceptions/contractErrors'

import { MockEip1193Provider } from '@/tests/mocks/providers'

const createSafeTx = (data = '0x'): SafeTransaction => {
  return {
    data: {
      to: '0x0000000000000000000000000000000000000000',
      value: '0x0',
      data,
      operation: 0,
      nonce: 100,
    },
    signatures: new Map([]),
    addSignature: function (sig: SafeSignature): void {
      this.signatures.set(sig.signer, sig)
    },
    encodedSignatures: function (): string {
      return Array.from(this.signatures)
        .map(([, sig]) => {
          return [sig.signer, sig.data].join(' = ')
        })
        .join('; ')
    },
  } as SafeTransaction
}

// `isValidTransaction` has full test coverage in `safe-core-sdk`
// https://github.com/safe-global/safe-core-sdk/blob/main/packages/safe-core-sdk/tests/execution.test.ts#L37-L101

describe('useIsValidExecution', () => {
  const mockReadOnlyProvider: JsonRpcProvider = new JsonRpcProvider()
  const mockProvider: BrowserProvider = new BrowserProvider(MockEip1193Provider)
  const mockWallet = {
    address: '',
    chainId: '5',
    label: '',
    provider: {} as unknown as Eip1193Provider,
  }

  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(web3, 'useWeb3ReadOnly').mockImplementation(() => mockReadOnlyProvider)
    jest.spyOn(useWallet, 'useSigner').mockReturnValue(mockWallet)
    jest.spyOn(web3, 'createWeb3').mockImplementation(() => mockProvider)
  })

  it('should map a known GS revert reason to its user-facing message', async () => {
    const error = new Error('Some error') as EthersError
    error.reason = 'GS026' as EthersTxReplacedReason

    jest.spyOn(contracts, 'getCurrentGnosisSafeContract').mockImplementation(() =>
      Promise.resolve({
        isValidTransaction: () => {
          throw error
        },
      } as unknown as SafeContractImplementationType),
    )

    const mockTx = createSafeTx()
    const mockGas = BigInt(1000)

    const { result } = renderHook(() => useIsValidExecution(mockTx, mockGas))

    var { isValidExecution, executionValidationError, isValidExecutionLoading } = result.current

    expect(isValidExecution).toEqual(undefined)
    expect(executionValidationError).toBe(undefined)
    expect(isValidExecutionLoading).toBe(true)

    await act(async () => {
      await new Promise(process.nextTick)
    })

    var { isValidExecution, executionValidationError, isValidExecutionLoading } = result.current

    expect(isValidExecution).toBe(undefined)
    // A reactive GS026 (cause unknown post-broadcast) resolves to the shared fallback.
    expect((executionValidationError as EthersError)?.reason).toBe(CONTRACT_ERROR_FALLBACK)
    expect(isValidExecutionLoading).toBe(false)
  })

  it('resolves the gas token symbol for GS012 (PR review)', async () => {
    const gasToken = '0x1111111111111111111111111111111111111111'

    const usdcItem = {
      tokenInfo: { address: gasToken, decimals: 6, logoUri: '', name: 'USD Coin', symbol: 'USDC', type: 'ERC20' },
      balance: '0',
      fiatBalance: '0',
      fiatConversion: '0',
    } as UseBalancesResult['balances']['items'][number]

    jest.spyOn(balancesHook, 'default').mockReturnValue({
      balances: { ...initialBalancesState, items: [usdcItem] },
      loaded: true,
      loading: false,
      error: undefined,
    })

    const error = new Error('Some error') as EthersError
    error.reason = 'GS012' as EthersTxReplacedReason

    jest.spyOn(contracts, 'getCurrentGnosisSafeContract').mockImplementation(() =>
      Promise.resolve({
        isValidTransaction: () => {
          throw error
        },
      } as unknown as SafeContractImplementationType),
    )

    const mockTx = createSafeTx()
    mockTx.data.gasToken = gasToken

    const { result } = renderHook(() => useIsValidExecution(mockTx, BigInt(1000)))

    await act(async () => {
      await new Promise(process.nextTick)
    })

    // The `{token}` placeholder must be resolved to the gas token symbol.
    expect((result.current.executionValidationError as EthersError)?.reason).toContain(
      'Not enough USDC to cover the network fee',
    )
  })

  it('does not re-run the simulation when balances identity changes (PR review)', async () => {
    const balancesResult: UseBalancesResult = {
      balances: { ...initialBalancesState, items: [] },
      loaded: true,
      loading: false,
      error: undefined,
    }
    const useBalancesSpy = jest.spyOn(balancesHook, 'default').mockReturnValue(balancesResult)

    const isValidTransaction = jest.fn().mockResolvedValue(true)
    jest
      .spyOn(contracts, 'getCurrentGnosisSafeContract')
      .mockImplementation(() => Promise.resolve({ isValidTransaction } as unknown as SafeContractImplementationType))

    const mockTx = createSafeTx()

    const { rerender } = renderHook(() => useIsValidExecution(mockTx, BigInt(1000)))

    await act(async () => {
      await new Promise(process.nextTick)
    })

    expect(isValidTransaction).toHaveBeenCalledTimes(1)

    // Simulate a balances poll: same data, new object identity
    useBalancesSpy.mockReturnValue({
      ...balancesResult,
      balances: { ...initialBalancesState, items: [] },
    })
    rerender()

    await act(async () => {
      await new Promise(process.nextTick)
    })

    expect(isValidTransaction).toHaveBeenCalledTimes(1)
  })
})
