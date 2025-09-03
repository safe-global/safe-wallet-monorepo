import { faker } from '@faker-js/faker'

import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getRecoveryState } from '@/features/recovery/services/recovery-state'
import { chainBuilder } from '@/tests/builders/chains'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { act, fireEvent, render, renderHook, waitFor } from '@/tests/test-utils'
import { useRecoveryState } from '../useRecoveryState'
import useTxHistory from '@/hooks/useTxHistory'
import { getRecoveryDelayModifiers } from '@/features/recovery/services/delay-modifier'
import { useAppDispatch } from '@/store'
import { txHistorySlice } from '@/store/txHistorySlice'
import { recoveryDispatch, RecoveryEvent, RecoveryTxType } from '@/features/recovery/services/recoveryEvents'
import RecoveryContextHooks from '../RecoveryContextHooks'

jest.mock('@/features/recovery/services/delay-modifier')
jest.mock('@/features/recovery/services/recovery-state')

const mockGetRecoveryDelayModifiers = getRecoveryDelayModifiers as jest.MockedFunction<typeof getRecoveryDelayModifiers>
const mockGetRecoveryState = getRecoveryState as jest.MockedFunction<typeof getRecoveryState>

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/web3')
jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useTxHistory')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseWeb3ReadOnly = useWeb3ReadOnly as jest.MockedFunction<typeof useWeb3ReadOnly>
const mockUseCurrentChain = useCurrentChain as jest.MockedFunction<typeof useCurrentChain>
const mockUseTxHistory = useTxHistory as jest.MockedFunction<typeof useTxHistory>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>

describe('useRecoveryState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not fetch if there is no Transaction Service', async () => {
    jest.useFakeTimers()

    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    mockUseCurrentChain.mockReturnValue(undefined)
    const safe = safeInfoBuilder().build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)
    const delayModifierAddress = faker.finance.ethereumAddress()
    const delayModifiers = [{ address: delayModifierAddress }]
    const mockTxHistory = {
      page: {
        results: [
          { type: 'DATE_LABEL' },
          {
            type: 'TRANSACTION',
            transaction: {
              txInfo: {
                type: 'Custom',
                to: {
                  value: delayModifierAddress,
                },
              },
            },
          },
        ],
      },
    }
    mockUseTxHistory.mockReturnValue(mockTxHistory as any)

    const { result } = renderHook(() => useRecoveryState(delayModifiers as any))

    // Give enough time for loading to occur, if it will
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current).toEqual([undefined, undefined, false])
    expect(mockGetRecoveryState).not.toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('should not fetch is there is no provider', async () => {
    jest.useFakeTimers()

    mockUseWeb3ReadOnly.mockReturnValue(undefined)
    const chain = chainBuilder().build()
    mockUseCurrentChain.mockReturnValue(chain)
    const safe = safeInfoBuilder().build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)
    const delayModifierAddress = faker.finance.ethereumAddress()
    const delayModifiers = [{ address: delayModifierAddress }]
    const mockTxHistory = {
      page: {
        results: [
          { type: 'DATE_LABEL' },
          {
            type: 'TRANSACTION',
            transaction: {
              txInfo: {
                type: 'Custom',
                to: {
                  value: delayModifierAddress,
                },
              },
            },
          },
        ],
      },
    }
    mockUseTxHistory.mockReturnValue(mockTxHistory as any)

    const { result } = renderHook(() => useRecoveryState(delayModifiers as any))

    // Give enough time for loading to occur, if it will
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current).toEqual([undefined, undefined, false])
    expect(mockGetRecoveryState).not.toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('should otherwise fetch', async () => {
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const chain = chainBuilder().build()
    mockUseCurrentChain.mockReturnValue(chain)
    const safe = safeInfoBuilder().build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)
    const delayModifierAddress = faker.finance.ethereumAddress()
    const delayModifiers = [{ address: delayModifierAddress }]
    const mockTxHistory = {
      page: {
        results: [
          { type: 'DATE_LABEL' },
          {
            type: 'TRANSACTION',
            transaction: {
              txInfo: {
                type: 'Custom',
                to: {
                  value: delayModifierAddress,
                },
              },
            },
          },
        ],
      },
    }
    mockUseTxHistory.mockReturnValue(mockTxHistory as any)

    renderHook(() => useRecoveryState(delayModifiers as any))

    await waitFor(() => {
      expect(mockGetRecoveryState).toHaveBeenCalledTimes(1)
    })
  })

  it('should refetch when interacting with a Delay Modifier via the Safe', async () => {
    mockUseHasFeature.mockReturnValue(true)
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const chainId = '5'
    const safe = safeInfoBuilder()
      .with({ chainId, modules: [addressExBuilder().build()] })
      .build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)
    const chain = chainBuilder().build()
    mockUseCurrentChain.mockReturnValue(chain)
    const delayModifierAddress = faker.finance.ethereumAddress()
    mockGetRecoveryDelayModifiers.mockResolvedValue([
      { getAddress: jest.fn().mockResolvedValue(delayModifierAddress) } as any,
    ])

    function Test() {
      const dispatch = useAppDispatch()

      const fakeTxHistoryPoll = () => {
        dispatch(
          txHistorySlice.actions.set({
            loading: false,
            loaded: true,
            data: {
              results: [
                {
                  type: 'TRANSACTION',
                  transaction: {
                    txInfo: {
                      type: 'Custom',
                      to: {
                        value: delayModifierAddress,
                      },
                    },
                  },
                },
              ],
            },
          } as any),
        )
      }

      return <button onClick={fakeTxHistoryPoll}>Fake poll</button>
    }

    const { queryByText } = render(
      <>
        <Test />
        <RecoveryContextHooks />
      </>,
    )

    await waitFor(() => {
      expect(mockGetRecoveryDelayModifiers).toHaveBeenCalledTimes(1)
      expect(mockGetRecoveryState).toHaveBeenCalledTimes(1)
    })

    act(() => {
      fireEvent.click(queryByText('Fake poll')!)
    })

    await waitFor(() => {
      expect(mockGetRecoveryState).toHaveBeenCalledTimes(2)
    })
  })

  it('should refetch when interacting with a Delay Modifier as a Recoverer', async () => {
    mockUseHasFeature.mockReturnValue(true)
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const chainId = '5'
    const safe = safeInfoBuilder()
      .with({ chainId, modules: [addressExBuilder().build()] })
      .build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)
    const chain = chainBuilder().build()
    mockUseCurrentChain.mockReturnValue(chain)
    const delayModifierAddress = faker.finance.ethereumAddress()
    mockGetRecoveryDelayModifiers.mockResolvedValue([{ address: delayModifierAddress } as any])

    render(<RecoveryContextHooks />)

    await waitFor(() => {
      expect(mockGetRecoveryDelayModifiers).toHaveBeenCalledTimes(1)
      expect(mockGetRecoveryState).toHaveBeenCalledTimes(1)
    })

    recoveryDispatch(RecoveryEvent.PROCESSED, {
      moduleAddress: delayModifierAddress,
      txHash: faker.string.hexadecimal(),
      recoveryTxHash: faker.string.hexadecimal(),
      txType: faker.helpers.enumValue(RecoveryTxType),
    })

    await waitFor(() => {
      expect(mockGetRecoveryState).toHaveBeenCalledTimes(2)
    })
  })
})
