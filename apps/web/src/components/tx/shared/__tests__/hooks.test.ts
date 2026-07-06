import { extendedSafeInfoBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { render, renderHook, waitFor } from '@/tests/test-utils'
import { zeroPadValue } from 'ethers'
import { createSafeTx } from '@/tests/builders/safeTx'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as wallet from '@/hooks/wallets/useWallet'
import * as walletHooks from '@/utils/wallets'
import * as pending from '@/hooks/usePendingTxs'
import * as txSender from '@/services/tx/tx-sender/dispatch'
import * as onboardHooks from '@/hooks/wallets/useOnboard'
import { type OnboardAPI } from '@web3-onboard/core'
import { createElement } from 'react'
import {
  useAlreadySigned,
  useImmediatelyExecutable,
  useIsExecutionLoop,
  useRecommendedNonce,
  useTxActions,
  useValidateNonce,
} from '../hooks'
import * as recommendedNonce from '@/services/tx/tx-sender/recommendedNonce'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { chainBuilder, relayerBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { type SignerWallet } from '@/components/common/WalletProvider'
import { type NestedWallet } from '@/utils/nested-safe-wallet'
import * as loadFeature from '@/features/__core__/useLoadFeature'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'

const chainInfo = chainBuilder().with({ chainId: '1' }).build()

describe('SignOrExecute hooks', () => {
  const extendedSafeInfo = extendedSafeInfoBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()

    // Onboard
    jest.spyOn(onboardHooks, 'default').mockReturnValue({
      setChain: jest.fn(),
      state: {
        get: () => ({
          wallets: [
            {
              label: 'MetaMask',
              accounts: [{ address: '0x1234567890000000000000000000000000000000' }],
              connected: true,
              chains: [{ id: '1' }],
            },
          ],
        }),
      },
    } as unknown as OnboardAPI)

    // Wallet
    jest.spyOn(wallet, 'useSigner').mockReturnValue({
      chainId: '1',
      address: '0x1234567890000000000000000000000000000000',
      provider: MockEip1193Provider,
    } as unknown as NestedWallet)

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainInfo)
  })

  describe('useValidateNonce', () => {
    it('should return true if nonce is correct', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: zeroPadValue('0x0000', 20),
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const { result } = renderHook(() => useValidateNonce(createSafeTx()))

      expect(result.current).toBe(true)
    })

    it('should return false if nonce is incorrect', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 90,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: zeroPadValue('0x0000', 20),
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const { result } = renderHook(() => useValidateNonce(createSafeTx()))

      expect(result.current).toBe(false)
    })
  })

  describe('useIsExecutionLoop', () => {
    it('should return true when a safe is executing its own transaction', () => {
      const address = zeroPadValue('0x0789', 20)

      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: address,
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: address },
          owners: [{ value: address }],
          nonce: 100,
          chainId: '1',
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(wallet, 'default').mockReturnValue({
        chainId: '1',
        label: 'MetaMask',
        address,
      } as ConnectedWallet)

      const { result } = renderHook(() => useIsExecutionLoop())

      expect(result.current).toBe(true)
    })

    it('should return false when a safe is not executing its own transaction', () => {
      jest.spyOn(wallet, 'default').mockReturnValue({
        chainId: '1',
        label: 'MetaMask',
        address: zeroPadValue('0x0456', 20),
      } as ConnectedWallet)

      const { result } = renderHook(() => useIsExecutionLoop())

      expect(result.current).toBe(false)
    })
  })

  describe('useImmediatelyExecutable', () => {
    it('should return true for newly created transactions with threshold 1 and no pending transactions', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: zeroPadValue('0x0000', 20),
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          owners: [{ value: zeroPadValue('0x0123', 20) }],
          threshold: 1,
          nonce: 100,
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(pending, 'useHasPendingTxs').mockReturnValue(false)

      const { result } = renderHook(() => useImmediatelyExecutable())

      expect(result.current).toBe(true)
    })

    it('should return false for newly created transactions with threshold > 1', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: zeroPadValue('0x0000', 20),
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          owners: [{ value: zeroPadValue('0x0123', 20) }],
          threshold: 2,
          nonce: 100,
          chainId: '1',
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(pending, 'useHasPendingTxs').mockReturnValue(false)

      const { result } = renderHook(() => useImmediatelyExecutable())

      expect(result.current).toBe(false)
    })

    it('should return false for safes with pending transactions', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: zeroPadValue('0x0000', 20),
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          owners: [{ value: zeroPadValue('0x0123', 20) }],
          threshold: 1,
          nonce: 100,
          chainId: '1',
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(pending, 'useHasPendingTxs').mockReturnValue(true)

      const { result } = renderHook(() => useImmediatelyExecutable())

      expect(result.current).toBe(false)
    })
  })

  describe('useTxActions', () => {
    it('should return sign and execute actions', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const { result } = renderHook(() => useTxActions())

      expect(result.current.signTx).toBeDefined()
      expect(result.current.executeTx).toBeDefined()
    })

    it('should sign a tx with or without an id', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(false))

      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)

      const signSpy = jest
        .spyOn(txSender, 'dispatchTxSigning')
        .mockImplementation(() => Promise.resolve(createSafeTx()))

      const onchainSignSpy = jest.spyOn(txSender, 'dispatchOnChainSigning').mockImplementation(() => Promise.resolve())

      const { result } = renderHook(() => useTxActions())
      const { signTx } = result.current

      const id = await signTx(createSafeTx())
      expect(signSpy).toHaveBeenCalled()
      expect(onchainSignSpy).not.toHaveBeenCalled()
      expect(id).toBe('123')

      const id2 = await signTx(createSafeTx(), '456')
      expect(signSpy).toHaveBeenCalled()
      expect(id2).toBe('123')
    })

    it('should sign a tx on-chain', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(true))

      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const signSpy = jest.spyOn(txSender, 'dispatchOnChainSigning').mockImplementation(() => Promise.resolve())

      const { result } = renderHook(() => useTxActions())
      const { signTx } = result.current

      const id = await signTx(createSafeTx(), '456')
      expect(signSpy).toHaveBeenCalled()
      expect(id).toBe('456')
    })

    it('should execute a tx without a txId (immediate execution)', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const executeSpy = jest
        .spyOn(txSender, 'dispatchTxExecution')
        .mockImplementation((() => Promise.resolve(createSafeTx())) as unknown as typeof txSender.dispatchTxExecution)

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const id = await executeTx({ gasPrice: 1 }, createSafeTx())
      expect(proposeSpy).toHaveBeenCalled()
      expect(executeSpy).toHaveBeenCalled()
      expect(id).toEqual('123')
    })

    it('should execute a tx with an id (existing tx)', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const executeSpy = jest
        .spyOn(txSender, 'dispatchTxExecution')
        .mockImplementation((() => Promise.resolve(createSafeTx())) as unknown as typeof txSender.dispatchTxExecution)

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const id = await executeTx({ gasPrice: 1 }, createSafeTx(), '455')
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(executeSpy).toHaveBeenCalled()
      expect(id).toEqual('455')
    })

    it('should throw an error if the tx is undefined', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const { result } = renderHook(() => useTxActions())
      const { signTx, executeTx } = result.current

      // Expect signTx to throw an error
      await expect(signTx()).rejects.toThrowError('Transaction not provided')
      await expect(executeTx({ gasPrice: 1 })).rejects.toThrowError('Transaction not provided')
    })

    it('should relay a tx execution', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          ...extendedSafeInfoBuilder().build(),
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 1,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const relaySpy = jest.spyOn(txSender, 'dispatchTxRelay').mockImplementation(() => Promise.resolve(undefined))

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const tx = createSafeTx()
      tx.addSignature({
        signer: '0x123',
        data: '0x0001',
        staticPart: () => '',
        dynamicPart: () => '',
        isContractSignature: false,
      })

      const id = await executeTx({ gasPrice: 1 }, tx, '123', 'origin.com', true)
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(relaySpy).toHaveBeenCalled()
      expect(id).toEqual('123')
    })

    it('should sign a not fully signed tx when relaying', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(false))

      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          ...extendedSafeInfoBuilder().build(),
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const tx = createSafeTx()
      tx.addSignature({
        signer: '0x123',
        data: '0x0001',
        staticPart: () => '',
        dynamicPart: () => '',
        isContractSignature: false,
      })

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const signSpy = jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation(() => {
        tx.addSignature({
          signer: '0x12345',
          data: '0x0001',
          staticPart: () => '',
          dynamicPart: () => '',
          isContractSignature: false,
        })
        return Promise.resolve(tx)
      })
      const relaySpy = jest.spyOn(txSender, 'dispatchTxRelay').mockImplementation(() => Promise.resolve(undefined))

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const id = await executeTx({ gasPrice: 1 }, tx, '123', 'origin.com', true)
      expect(proposeSpy).toHaveBeenCalled()
      expect(signSpy).toHaveBeenCalled()
      expect(relaySpy).toHaveBeenCalled()
      expect(id).toEqual('123')
    })

    it('should throw when relaying an unsigned tx as a smart contract wallet', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockResolvedValue(true)

      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          ...extendedSafeInfoBuilder().build(),
          version: '1.3.0',
          address: { value: zeroPadValue('0x0000', 20) },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: '0x123',
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))

      const tx = createSafeTx()
      tx.addSignature({
        signer: '0x123',
        data: '0x0001',
        staticPart: () => '',
        dynamicPart: () => '',
        isContractSignature: false,
      })

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const signSpy = jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation(() => {
        tx.addSignature({
          signer: '0x12345',
          data: '0x0001',
          staticPart: () => '',
          dynamicPart: () => '',
          isContractSignature: false,
        })
        return Promise.resolve(tx)
      })
      const relaySpy = jest.spyOn(txSender, 'dispatchTxRelay').mockImplementation(() => Promise.resolve(undefined))

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      await expect(executeTx({ gasPrice: 1 }, tx, '123', 'origin.com', true)).rejects.toThrowError(
        'Cannot relay an unsigned transaction from a smart contract wallet',
      )

      expect(proposeSpy).not.toHaveBeenCalled()
      expect(signSpy).not.toHaveBeenCalled()
      expect(relaySpy).not.toHaveBeenCalled()
    })
  })

  describe('useAlreadySigned', () => {
    it('should return true if wallet already signed a tx', () => {
      // Wallet
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
      } as SignerWallet)

      const tx = createSafeTx()
      tx.addSignature({
        signer: '0x1234567890000000000000000000000000000000',
        data: '0x0001',
        staticPart: () => '',
        dynamicPart: () => '',
        isContractSignature: false,
      })
      const { result } = renderHook(() => useAlreadySigned(tx))
      expect(result.current).toEqual(true)
    })

    it('should return false if wallet has not signed a tx yet', () => {
      // Wallet
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
      } as SignerWallet)

      const tx = createSafeTx()
      tx.addSignature({
        signer: '0x00000000000000000000000000000000000000000',
        data: '0x0001',
        staticPart: () => '',
        dynamicPart: () => '',
        isContractSignature: false,
      })
      const { result } = renderHook(() => useAlreadySigned(tx))
      expect(result.current).toEqual(false)
    })
  })

  describe('useRecommendedNonce', () => {
    it('should return undefined without safe info', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...defaultSafeInfo, deployed: false },
        safeAddress: '',
        safeLoaded: true,
        safeLoading: false,
      })

      const { result } = renderHook(useRecommendedNonce)
      await waitFor(() => {
        expect(result.current).toBeUndefined()
      })
    })
    it('should return 0 for counterfactual Safes', async () => {
      const mockSafeInfo = safeInfoBuilder().build()
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...mockSafeInfo, deployed: false },
        safeAddress: mockSafeInfo.address.value,
        safeLoaded: true,
        safeLoading: false,
      })

      const { result } = renderHook(useRecommendedNonce)
      await waitFor(() => {
        expect(result.current).toEqual(0)
      })
    })

    it('should update if queueTag changes', async () => {
      jest.spyOn(recommendedNonce, 'getNonces').mockResolvedValue({
        currentNonce: 1,
        recommendedNonce: 1,
      })
      const mockSafeInfo = safeInfoBuilder()
        .with({
          txQueuedTag: '1',
        })
        .build()
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...mockSafeInfo, deployed: true },
        safeAddress: mockSafeInfo.address.value,
        safeLoaded: true,
        safeLoading: false,
      })

      const { result, rerender } = renderHook(useRecommendedNonce)
      await waitFor(() => {
        expect(result.current).toEqual(1)
      })

      jest.spyOn(recommendedNonce, 'getNonces').mockResolvedValue({
        currentNonce: 1,
        recommendedNonce: 2,
      })

      rerender()
      // The hook does not rerender as the queue tag did not change yet
      await waitFor(() => {
        expect(result.current).toEqual(1)
      })

      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...mockSafeInfo, deployed: true, txQueuedTag: '2' },
        safeAddress: mockSafeInfo.address.value,
        safeLoaded: true,
        safeLoading: false,
      })

      rerender()

      // Now the queue tag changed from 1 to 2 and the hook should reflect the new recommended Nonce
      await waitFor(() => {
        expect(result.current).toEqual(2)
      })
    })

    it('should update if historyTag changes', async () => {
      jest.spyOn(recommendedNonce, 'getNonces').mockResolvedValue({
        currentNonce: 1,
        recommendedNonce: 1,
      })
      const mockSafeInfo = safeInfoBuilder()
        .with({
          txHistoryTag: '1',
        })
        .build()
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...mockSafeInfo, deployed: true },
        safeAddress: mockSafeInfo.address.value,
        safeLoaded: true,
        safeLoading: false,
      })

      const { result, rerender } = renderHook(useRecommendedNonce)
      await waitFor(() => {
        expect(result.current).toEqual(1)
      })

      jest.spyOn(recommendedNonce, 'getNonces').mockResolvedValue({
        currentNonce: 2,
        recommendedNonce: 2,
      })

      rerender()
      // The hook does not rerender as the history tag did not change yet
      await waitFor(() => {
        expect(result.current).toEqual(1)
      })

      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...mockSafeInfo, deployed: true, txHistoryTag: '2' },
        safeAddress: mockSafeInfo.address.value,
        safeLoaded: true,
        safeLoading: false,
      })

      rerender()

      // Now the history tag changed from 1 to 2 and the hook should reflect the new recommended Nonce
      await waitFor(() => {
        expect(result.current).toEqual(2)
      })
    })
  })

  describe('useTxActions — GTF fee-params merge', () => {
    const GAS_TOKEN = '0xa0b86991000000000000000000000000000000aa'
    const SAFE_ADDRESS = zeroPadValue('0x0000', 20)

    const captureActions = (overrides: Partial<SafeTxContextParams> = {}) => {
      const ref: { current?: ReturnType<typeof useTxActions> } = {}
      const contextValue: SafeTxContextParams = {
        setSafeTx: jest.fn(),
        setSafeMessage: jest.fn(),
        setSafeMessageHash: jest.fn(),
        setSafeTxError: jest.fn(),
        setNonce: jest.fn(),
        setNonceNeeded: jest.fn(),
        setSafeTxGas: jest.fn(),
        setTxOrigin: jest.fn(),
        isReadOnly: false,
        gtfPaymentMode: 'safe',
        setGtfPaymentMode: jest.fn(),
        gtfSelectedGasToken: GAS_TOKEN,
        setGtfSelectedGasToken: jest.fn(),
        ...overrides,
      }
      const Harness = () => {
        ref.current = useTxActions()
        return null
      }
      render(createElement(SafeTxContext.Provider, { value: contextValue }, createElement(Harness)))
      return ref
    }

    const setupGtfChain = () => {
      const gtfChain = chainBuilder()
        .with({ chainId: '1', relayer: relayerBuilder().with({ type: 'GTF' }).build() })
        .build()
      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(gtfChain)
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version: '1.3.0',
          address: { value: SAFE_ADDRESS },
          nonce: 100,
          threshold: 2,
          owners: [{ value: zeroPadValue('0x0123', 20) }, { value: zeroPadValue('0x0456', 20) }],
          chainId: '1',
        },
        safeAddress: SAFE_ADDRESS,
        safeError: undefined,
        safeLoading: false,
        safeLoaded: true,
      }))
    }

    const mockFeatureResolve = (resolveFeeParams: jest.Mock) => {
      jest.spyOn(loadFeature, 'useLoadFeature').mockReturnValue({
        $isReady: true,
        $isDisabled: false,
        $error: undefined,
        resolveFeeParams,
      } as unknown as ReturnType<typeof loadFeature.useLoadFeature>)
    }

    it('invokes resolveFeeParams on first-signer sign when GTF + Safe-pays guards pass', async () => {
      setupGtfChain()
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(false))

      const mergedTx = createSafeTx()
      const resolveFeeParams = jest.fn().mockResolvedValue(mergedTx)
      mockFeatureResolve(resolveFeeParams)

      const signSpy = jest.spyOn(txSender, 'dispatchTxSigning').mockResolvedValue(mergedTx)
      jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)

      const ref = captureActions()
      await ref.current!.signTx(createSafeTx())

      expect(resolveFeeParams).toHaveBeenCalledWith(
        expect.objectContaining({ gasToken: GAS_TOKEN, numberSignatures: 2 }),
      )
      expect(signSpy).toHaveBeenCalledWith(mergedTx, expect.anything(), undefined)
    })

    it('skips the merge for confirmers (safeTx already has a signature)', async () => {
      setupGtfChain()
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(false))

      const resolveFeeParams = jest.fn()
      mockFeatureResolve(resolveFeeParams)

      jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation((tx) => Promise.resolve(tx))
      jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)

      const signedTx = createSafeTx()
      signedTx.addSignature({
        signer: zeroPadValue('0x0123', 20),
        data: '0x01',
        staticPart: () => '0x01',
        dynamicPart: () => '',
        isContractSignature: false,
      })

      const ref = captureActions()
      await ref.current!.signTx(signedTx)

      expect(resolveFeeParams).not.toHaveBeenCalled()
    })

    it('skips the merge in signer-pays mode', async () => {
      setupGtfChain()
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(false))

      const resolveFeeParams = jest.fn()
      mockFeatureResolve(resolveFeeParams)

      jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation((tx) => Promise.resolve(tx))
      jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)

      const ref = captureActions({ gtfPaymentMode: 'signer', gtfSelectedGasToken: undefined })
      await ref.current!.signTx(createSafeTx())

      expect(resolveFeeParams).not.toHaveBeenCalled()
    })
  })
})
