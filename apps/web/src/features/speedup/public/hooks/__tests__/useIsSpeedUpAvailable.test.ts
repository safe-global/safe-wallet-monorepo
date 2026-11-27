import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useHasFeature } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { PendingStatus, PendingTxType, type PendingTx } from '@/store/pendingTxsSlice'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { isSmartContract } from '@/utils/wallets'
import useIsSpeedUpAvailable from '../useIsSpeedUpAvailable'

jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))
const mockProvider = {}
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({ useWeb3ReadOnly: () => mockProvider }))
jest.mock('@/utils/wallets', () => ({ isSmartContract: jest.fn(async () => false) }))

const NOW = new Date('2026-11-23T12:00:00.000Z').getTime()
const signerAddress = checksumAddress(faker.finance.ethereumAddress())

const processing = (submittedAt: number): PendingTx => ({
  chainId: '1',
  safeAddress: checksumAddress(faker.finance.ethereumAddress()),
  nonce: 1,
  status: PendingStatus.PROCESSING,
  txType: PendingTxType.SAFE_TX,
  txHash: '0x1',
  submittedAt,
  signerNonce: 1,
  signerAddress,
})

describe('useIsSpeedUpAvailable', () => {
  beforeEach(() => {
    jest.setSystemTime(NOW)
    ;(useHasFeature as jest.Mock).mockReturnValue(true)
    ;(useWallet as jest.Mock).mockReturnValue(connectedWalletBuilder().with({ address: signerAddress }).build())
  })

  it('is false with speed up off on the chain', async () => {
    ;(useHasFeature as jest.Mock).mockReturnValue(false)

    const { result } = renderHook(() => useIsSpeedUpAvailable(processing(NOW - 60_000)))
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(result.current).toBe(false)
  })

  it('turns true 15 seconds after the connected wallet submitted it', async () => {
    const { result } = renderHook(() => useIsSpeedUpAvailable(processing(NOW - 14_000)))
    await act(() => jest.advanceTimersByTimeAsync(0))
    expect(result.current).toBe(false)

    await act(() => jest.advanceTimersByTimeAsync(1_000))

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('is false when another wallet submitted it', async () => {
    ;(useWallet as jest.Mock).mockReturnValue(connectedWalletBuilder().build())

    const { result } = renderHook(() => useIsSpeedUpAvailable(processing(NOW - 60_000)))
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(result.current).toBe(false)
  })

  it('is false when the signer is a smart contract wallet', async () => {
    ;(isSmartContract as jest.Mock).mockResolvedValueOnce(true)

    const { result } = renderHook(() => useIsSpeedUpAvailable(processing(NOW - 60_000)))
    await act(() => jest.advanceTimersByTimeAsync(1_000))

    expect(isSmartContract).toHaveBeenCalledWith(signerAddress)
    expect(result.current).toBe(false)
  })

  it('is false once it is in a block', async () => {
    const { result } = renderHook(() =>
      useIsSpeedUpAvailable({ chainId: '1', safeAddress: signerAddress, nonce: 1, status: PendingStatus.INDEXING }),
    )
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(result.current).toBe(false)
  })
})
