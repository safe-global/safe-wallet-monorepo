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
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { type SignerWallet } from '@/components/common/WalletProvider'
import { type NestedWallet } from '@/utils/nested-safe-wallet'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as loadFeature from '@/features/__core__/useLoadFeature'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { type NestedTxEnvelope } from '@/services/tx/nestedTxEnvelope'

const chainInfo = chainBuilder().with({ chainId: '1' }).build()

// The GS026 pre-checks have their own suite (services/tx/__tests__/executionPreChecks.test.ts);
// these tests exercise the dispatch orchestration, where the mocked wallet is not
// an owner of the mocked Safe and would otherwise be blocked by NOT_SIGNER.
jest.mock('@/services/tx/executionPreChecks', () => ({
  ...jest.requireActual('@/services/tx/executionPreChecks'),
  runExecutionPreChecks: jest.fn(() => Promise.resolve()),
}))

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

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const confirmSpy = jest
        .spyOn(txSender, 'dispatchTxConfirmation')
        .mockImplementation((() =>
          Promise.resolve({ txId: '456' })) as unknown as typeof txSender.dispatchTxConfirmation)

      const signedTx = createSafeTx()
      const signSpy = jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation(() => Promise.resolve(signedTx))

      const onchainSignSpy = jest
        .spyOn(txSender, 'dispatchOnChainSigning')
        .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { signTx } = result.current

      // First signature: the tx is not yet known to CGW, so it is proposed
      const id = await signTx(createSafeTx())
      expect(signSpy).toHaveBeenCalled()
      expect(onchainSignSpy).not.toHaveBeenCalled()
      expect(proposeSpy).toHaveBeenCalledTimes(1)
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(id.txId).toBe('123')

      // Subsequent signature: the tx already has an id, so only the signature is added
      const id2 = await signTx(createSafeTx(), '456')
      expect(signSpy).toHaveBeenCalledTimes(2)
      expect(proposeSpy).toHaveBeenCalledTimes(1)
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          txId: '456',
          safeTx: signedTx,
          sender: '0x1234567890000000000000000000000000000000',
          chainId: '1',
        }),
      )
      expect(id2.txId).toBe('456')
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
      const signSpy = jest
        .spyOn(txSender, 'dispatchOnChainSigning')
        .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { signTx } = result.current

      const id = await signTx(createSafeTx(), '456')
      expect(signSpy).toHaveBeenCalled()
      expect(id.txId).toBe('456')
    })

    it('should propose before signing on-chain when a non-Safe smart account is the first signer', async () => {
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

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const signSpy = jest
        .spyOn(txSender, 'dispatchOnChainSigning')
        .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { signTx } = result.current

      const id = await signTx(createSafeTx())
      expect(proposeSpy).toHaveBeenCalled()
      expect(signSpy).toHaveBeenCalledWith(
        expect.anything(),
        '123',
        expect.anything(),
        '1',
        expect.anything(),
        expect.anything(),
        false,
        true,
        '1.3.0',
        undefined,
      )
      expect(id).toEqual({ txId: '123', isNestedSigning: false })
    })

    it('should NOT propose to CGW for a Safe signer (only the parent proposes)', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(true))
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
        isSafe: true,
        threshold: 2,
      } as unknown as NestedWallet)

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
      const signSpy = jest
        .spyOn(txSender, 'dispatchOnChainSigning')
        .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { signTx } = result.current

      const id = await signTx(createSafeTx())
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(signSpy).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        expect.anything(),
        '1',
        expect.anything(),
        expect.anything(),
        true,
        false,
        '1.3.0',
        undefined,
      )
      expect(id).toEqual({ txId: 'derived_id', isNestedSigning: true })
    })

    it('should propose the parent tx with the nested child tx carried by the flow', async () => {
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

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation(() => Promise.resolve(createSafeTx()))

      const nestedChildTx: NestedTxEnvelope = {
        chainId: '1',
        safe: zeroPadValue('0x0def', 20),
        nonce: 7,
        to: zeroPadValue('0x0456', 20),
        value: '1',
        data: '0xabcdef',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: zeroPadValue('0x00', 20),
        refundReceiver: zeroPadValue('0x00', 20),
      }

      const ref: { current?: ReturnType<typeof useTxActions> } = {}
      const Harness = () => {
        ref.current = useTxActions()
        return null
      }
      const flowContext: TxFlowContextType = { ...initialContext, data: { nestedChildTx } }
      render(createElement(TxFlowContext.Provider, { value: flowContext }, createElement(Harness)))

      await ref.current!.signTx(createSafeTx())

      expect(proposeSpy).toHaveBeenCalledWith(expect.objectContaining({ nestedTransaction: nestedChildTx }))
    })

    const mockEnvelopelessSafe = (version: string) =>
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
        safe: {
          ...extendedSafeInfo,
          version,
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

    it("should sign the child hash with the EOA when the nested signer's child Safe does not support the envelope", async () => {
      const connectedWallet = {
        label: 'MetaMask',
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
      } as ConnectedWallet
      jest.spyOn(wallet, 'default').mockReturnValue(connectedWallet)
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(true))
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: zeroPadValue('0x0456', 20),
        provider: MockEip1193Provider,
        isSafe: true,
        threshold: 2,
      } as unknown as NestedWallet)

      mockEnvelopelessSafe('1.1.1')

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const signSpy = jest.spyOn(txSender, 'dispatchOnChainSigning')
      const nestedSpy = jest.spyOn(txSender, 'dispatchNestedTxCreation').mockResolvedValue('nested-id')

      const { result } = renderHook(() => useTxActions())
      const safeTx = createSafeTx()

      const id = await result.current.signTx(safeTx, undefined, 'origin')

      // Without an envelope the child tx is proposed here, and the queue rejects unsigned proposals
      expect(id).toEqual({ txId: 'nested-id', isNestedSigning: true })
      expect(nestedSpy).toHaveBeenCalledWith({
        safeTx,
        wallet: connectedWallet,
        parentSafeAddress: zeroPadValue('0x0456', 20),
        parentProvider: MockEip1193Provider,
        chainId: '1',
        safeAddress: zeroPadValue('0x0000', 20),
        executed: false,
        origin: 'origin',
        scope: undefined,
        nestedTransaction: undefined,
      })
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(signSpy).not.toHaveBeenCalled()
    })

    it('should propose unsigned for a WalletConnect-connected Safe, which has no EOA to sign the child hash', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(true))
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: zeroPadValue('0x0456', 20),
        provider: MockEip1193Provider,
        isConnectedSafe: true,
      } as unknown as SignerWallet)

      mockEnvelopelessSafe('1.1.1')

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const signSpy = jest
        .spyOn(txSender, 'dispatchOnChainSigning')
        .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))
      const nestedSpy = jest.spyOn(txSender, 'dispatchNestedTxCreation')

      const { result } = renderHook(() => useTxActions())

      const id = await result.current.signTx(createSafeTx())

      expect(nestedSpy).not.toHaveBeenCalled()
      expect(proposeSpy).toHaveBeenCalled()
      expect(signSpy).toHaveBeenCalledWith(
        expect.anything(),
        '123',
        expect.anything(),
        '1',
        expect.anything(),
        expect.anything(),
        true,
        false,
        '1.1.1',
        undefined,
      )
      expect(id).toEqual({ txId: '123', isNestedSigning: true })
    })

    it.each([
      ['executes immediately', 1, true],
      ['only queues the approveHash', 2, false],
    ])(
      'should mark the tx as executed=%s when a WalletConnect-connected Safe at threshold %i signs',
      async (_label, threshold, executed) => {
        jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(true))
        jest.spyOn(wallet, 'useSigner').mockReturnValue({
          chainId: '1',
          address: zeroPadValue('0x0456', 20),
          provider: MockEip1193Provider,
          isConnectedSafe: true,
          threshold,
        } as unknown as SignerWallet)

        mockEnvelopelessSafe('1.1.1')

        jest
          .spyOn(txSender, 'dispatchTxProposal')
          .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
        const signSpy = jest
          .spyOn(txSender, 'dispatchOnChainSigning')
          .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))

        const { result } = renderHook(() => useTxActions())

        await result.current.signTx(createSafeTx())

        expect(signSpy).toHaveBeenCalledWith(
          expect.anything(),
          '123',
          expect.anything(),
          '1',
          expect.anything(),
          expect.anything(),
          true,
          executed,
          '1.1.1',
          undefined,
        )
      },
    )

    it('should confirm an existing tx on-chain without re-proposing when the nested signer adds a signature', async () => {
      jest.spyOn(walletHooks, 'isSmartContractWallet').mockReturnValue(Promise.resolve(true))
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: zeroPadValue('0x0456', 20),
        provider: MockEip1193Provider,
        isSafe: true,
        threshold: 2,
      } as unknown as NestedWallet)

      mockEnvelopelessSafe('1.1.1')

      const proposeSpy = jest.spyOn(txSender, 'dispatchTxProposal')
      const signSpy = jest
        .spyOn(txSender, 'dispatchOnChainSigning')
        .mockImplementation((_safeTx, txId) => Promise.resolve(txId ?? 'derived_id'))
      const nestedSpy = jest.spyOn(txSender, 'dispatchNestedTxCreation')

      const { result } = renderHook(() => useTxActions())

      const id = await result.current.signTx(createSafeTx(), '456')

      expect(id).toEqual({ txId: '456', isNestedSigning: true })
      expect(nestedSpy).not.toHaveBeenCalled()
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(signSpy).toHaveBeenCalledWith(
        expect.anything(),
        '456',
        expect.anything(),
        '1',
        expect.anything(),
        expect.anything(),
        true,
        false,
        '1.1.1',
        undefined,
      )
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
        .mockImplementation((_chainId, _safeTx, _txOptions, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const id = await executeTx({ gasPrice: 1 }, createSafeTx())
      expect(proposeSpy).toHaveBeenCalled()
      expect(executeSpy).toHaveBeenCalled()
      expect(id.txId).toEqual('123')
    })

    it('should NOT propose to CGW when a Safe executor executes without a txId', async () => {
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
        isSafe: true,
        threshold: 2,
      } as unknown as NestedWallet)

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
        .mockImplementation((_chainId, _safeTx, _txOptions, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const id = await executeTx({ gasPrice: 1 }, createSafeTx())
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(executeSpy).toHaveBeenCalledWith(
        '1',
        expect.anything(),
        { gasPrice: 1 },
        undefined,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true,
        false,
        true,
        '1.3.0',
        undefined,
      )
      expect(id).toEqual({ txId: 'derived_id', isExecuted: false })
    })

    it('should not treat the in-app nested signer at threshold 1 as executing immediately', async () => {
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
        isSafe: true,
        threshold: 1,
      } as unknown as NestedWallet)

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

      const executeSpy = jest
        .spyOn(txSender, 'dispatchTxExecution')
        .mockImplementation((_chainId, _safeTx, _txOptions, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())

      const id = await result.current.executeTx({ gasPrice: 1 }, createSafeTx())

      expect(executeSpy).toHaveBeenCalledWith(
        '1',
        expect.anything(),
        { gasPrice: 1 },
        undefined,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true,
        false,
        true,
        '1.3.0',
        undefined,
      )
      expect(id).toEqual({ txId: 'derived_id', isExecuted: false })
    })

    it('should treat a WalletConnect-connected Safe at threshold 1 as executing immediately', async () => {
      jest.spyOn(wallet, 'useSigner').mockReturnValue({
        chainId: '1',
        address: '0x1234567890000000000000000000000000000000',
        provider: MockEip1193Provider,
        isConnectedSafe: true,
        threshold: 1,
      } as unknown as SignerWallet)

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

      const executeSpy = jest
        .spyOn(txSender, 'dispatchTxExecution')
        .mockImplementation((_chainId, _safeTx, _txOptions, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())

      const id = await result.current.executeTx({ gasPrice: 1 }, createSafeTx())

      expect(executeSpy).toHaveBeenCalledWith(
        '1',
        expect.anything(),
        { gasPrice: 1 },
        undefined,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        true,
        true,
        true,
        '1.3.0',
        undefined,
      )
      expect(id).toEqual({ txId: 'derived_id', isExecuted: true })
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
        .mockImplementation((_chainId, _safeTx, _txOptions, txId) => Promise.resolve(txId ?? 'derived_id'))

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      const id = await executeTx({ gasPrice: 1 }, createSafeTx(), '455')
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(executeSpy).toHaveBeenCalled()
      expect(id.txId).toEqual('455')
    })

    it('should block the broadcast when a GS026 pre-check fails', async () => {
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

      const { runExecutionPreChecks } = jest.requireMock('@/services/tx/executionPreChecks')
      const { Gs026PreCheckError } = jest.requireActual('@/services/tx/executionPreChecks')
      runExecutionPreChecks.mockRejectedValueOnce(new Gs026PreCheckError('STALE_NONCE'))

      const proposeSpy = jest
        .spyOn(txSender, 'dispatchTxProposal')
        .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
      const executeSpy = jest
        .spyOn(txSender, 'dispatchTxExecution')
        .mockImplementation((() => Promise.resolve(createSafeTx())) as unknown as typeof txSender.dispatchTxExecution)

      const { result } = renderHook(() => useTxActions())
      const { executeTx } = result.current

      await expect(executeTx({ gasPrice: 1 }, createSafeTx(), '455')).rejects.toThrow(
        'Another transaction used this nonce. Refresh to get the current one.',
      )

      // Nothing was proposed or broadcast
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(executeSpy).not.toHaveBeenCalled()
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
      await expect(signTx()).rejects.toThrow('Transaction not provided')
      await expect(executeTx({ gasPrice: 1 })).rejects.toThrow('Transaction not provided')
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
      expect(id.txId).toEqual('123')
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
      const confirmSpy = jest
        .spyOn(txSender, 'dispatchTxConfirmation')
        .mockImplementation((() =>
          Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxConfirmation)
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
      expect(signSpy).toHaveBeenCalled()
      expect(proposeSpy).not.toHaveBeenCalled()
      expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({ txId: '123', safeTx: tx }))
      expect(relaySpy).toHaveBeenCalled()
      expect(id.txId).toEqual('123')
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

      await expect(executeTx({ gasPrice: 1 }, tx, '123', 'origin.com', true)).rejects.toThrow(
        'Cannot relay an unsigned transaction from a smart contract wallet',
      )

      expect(proposeSpy).not.toHaveBeenCalled()
      expect(signSpy).not.toHaveBeenCalled()
      expect(relaySpy).not.toHaveBeenCalled()
    })

    describe('sign-then-execute flow', () => {
      const setupThreshold1Safe = () => {
        jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
          safe: {
            ...extendedSafeInfo,
            version: '1.3.0',
            address: { value: zeroPadValue('0x0000', 20) },
            nonce: 100,
            threshold: 1,
            owners: [{ value: zeroPadValue('0x0123', 20) }],
            chainId: '1',
          },
          safeAddress: zeroPadValue('0x0000', 20),
          safeError: undefined,
          safeLoading: false,
          safeLoaded: true,
        }))
      }

      it('signs before executing a new unsigned tx for an EOA wallet', async () => {
        jest.spyOn(walletHooks, 'isSmartContractWallet').mockResolvedValue(false)
        setupThreshold1Safe()

        const tx = createSafeTx()
        const signedTx = createSafeTx()
        signedTx.addSignature({
          signer: '0x1234567890000000000000000000000000000000',
          data: '0x0001',
          staticPart: () => '',
          dynamicPart: () => '',
          isContractSignature: false,
        })

        const callOrder: string[] = []
        const signSpy = jest.spyOn(txSender, 'dispatchTxSigning').mockImplementation(() => {
          callOrder.push('sign')
          return Promise.resolve(signedTx)
        })
        jest.spyOn(txSender, 'dispatchTxProposal').mockImplementation((() => {
          callOrder.push('propose')
          return Promise.resolve({ txId: '123' })
        }) as unknown as typeof txSender.dispatchTxProposal)
        const executeSpy = jest.spyOn(txSender, 'dispatchTxExecution').mockImplementation(((
          _chainId: string,
          _safeTx: unknown,
          _txOptions: unknown,
          txId: string,
        ) => {
          callOrder.push('execute')
          return Promise.resolve(txId)
        }) as unknown as typeof txSender.dispatchTxExecution)

        const { result } = renderHook(() => useTxActions())
        const id = await result.current.executeTx({ gasPrice: 1 }, tx)

        expect(signSpy).toHaveBeenCalledWith(tx, MockEip1193Provider, undefined)
        expect(callOrder).toEqual(['sign', 'propose', 'execute'])
        expect(id).toEqual({ txId: '123', isExecuted: true })
        expect(executeSpy.mock.calls[0][1]).toBe(signedTx)
      })

      it('clears the pre-validated-sig gas estimate before executing after EIP-712 signing', async () => {
        jest.spyOn(walletHooks, 'isSmartContractWallet').mockResolvedValue(false)
        setupThreshold1Safe()

        const tx = createSafeTx()
        const signedTx = createSafeTx()
        signedTx.addSignature({
          signer: '0x1234567890000000000000000000000000000000',
          data: '0x0001',
          staticPart: () => '',
          dynamicPart: () => '',
          isContractSignature: false,
        })

        jest.spyOn(txSender, 'dispatchTxSigning').mockResolvedValue(signedTx)
        jest
          .spyOn(txSender, 'dispatchTxProposal')
          .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
        const executeSpy = jest
          .spyOn(txSender, 'dispatchTxExecution')
          .mockImplementation((() => Promise.resolve('0xhash')) as unknown as typeof txSender.dispatchTxExecution)

        const { result } = renderHook(() => useTxActions())
        // Pass a gasLimit that was estimated with a pre-validated signature
        await result.current.executeTx({ gasPrice: 1, gasLimit: 50000 }, tx)

        // gasLimit must be cleared so the SDK re-estimates with the actual EIP-712 signature
        const [, , calledTxOptions] = executeSpy.mock.calls[0]
        expect(calledTxOptions).not.toHaveProperty('gasLimit', 50000)
        expect(calledTxOptions?.gasLimit).toBeUndefined()
      })

      it('skips signing when the tx is already fully signed', async () => {
        jest.spyOn(walletHooks, 'isSmartContractWallet').mockResolvedValue(false)
        setupThreshold1Safe()

        const tx = createSafeTx()
        tx.addSignature({
          signer: '0x1234567890000000000000000000000000000000',
          data: '0x0001',
          staticPart: () => '',
          dynamicPart: () => '',
          isContractSignature: false,
        })

        const signSpy = jest.spyOn(txSender, 'dispatchTxSigning')
        jest
          .spyOn(txSender, 'dispatchTxExecution')
          .mockImplementation((() => Promise.resolve('0xhash')) as unknown as typeof txSender.dispatchTxExecution)

        const { result } = renderHook(() => useTxActions())
        await result.current.executeTx({ gasPrice: 1 }, tx, '123')

        expect(signSpy).not.toHaveBeenCalled()
      })

      it('skips signing for SC wallets and uses implicit executor approval', async () => {
        jest.spyOn(walletHooks, 'isSmartContractWallet').mockResolvedValue(true)
        setupThreshold1Safe()

        const tx = createSafeTx()

        const signSpy = jest.spyOn(txSender, 'dispatchTxSigning')
        jest
          .spyOn(txSender, 'dispatchTxProposal')
          .mockImplementation((() => Promise.resolve({ txId: '123' })) as unknown as typeof txSender.dispatchTxProposal)
        jest
          .spyOn(txSender, 'dispatchTxExecution')
          .mockImplementation((() => Promise.resolve('0xhash')) as unknown as typeof txSender.dispatchTxExecution)

        const { result } = renderHook(() => useTxActions())
        await result.current.executeTx({ gasPrice: 1 }, tx)

        expect(signSpy).not.toHaveBeenCalled()
      })
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
      // Safe-pays requires both the GTF flag and a RELAY_FEE relayer on the chain.
      const gtfChain = chainBuilder()
        .with({
          chainId: '1',
          features: [FEATURES.GTF],
          relayer: {
            type: 'RELAY_FEE',
            safeCreationSponsored: false,
            safeTransactionSponsored: false,
            enableTenderlySimulationBeforeRelay: false,
            gasPaymentOptions: ['SUBSCRIPTION'],
          },
        })
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
      expect(signSpy).toHaveBeenCalledWith(mergedTx, expect.anything(), undefined, undefined)
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
