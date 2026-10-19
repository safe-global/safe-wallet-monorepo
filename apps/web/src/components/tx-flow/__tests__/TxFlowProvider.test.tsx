import { type PropsWithChildren, useContext } from 'react'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import TxFlowProvider, { TxFlowContext } from '../TxFlowProvider'
import { faker } from '@faker-js/faker'
import type { SafeTransaction } from '@safe-global/types-kit'
import { SafeTxContext, type SafeTxContextParams } from '../SafeTxProvider'
import { useSigner } from '@/hooks/wallets/useWallet'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { safeSignatureBuilder, safeTxBuilder } from '@/tests/builders/safeTx'
import { useAlreadySigned } from '@/components/tx/shared/hooks'
import * as walletUtils from '@/utils/wallets'
import { trackTxEvents } from '@/components/tx/shared/tracking'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useCurrentChain: jest.fn(() => ({ chainId: '1', features: [] })),
  useHasFeature: jest.fn(() => false),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: jest.fn(() => undefined),
}))

jest.mock('@/features/counterfactual', () => ({ useIsCounterfactualSafe: jest.fn(() => false) }))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShield: jest.fn(() => ({ needsRiskConfirmation: false, isRiskConfirmed: false })),
}))

jest.mock('@/hooks/useTxDetails', () => ({ __esModule: true, default: jest.fn(() => [undefined, undefined, false]) }))

jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: jest.fn(() => true) }))

jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  default: jest.fn(),
  useIsWalletProposer: jest.fn(() => false),
}))

jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
  useImmediatelyExecutable: jest.fn(() => true),
  useValidateNonce: jest.fn(() => true),
  useIsExecutionLoop: jest.fn(() => false),
  useTxActions: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/transactions'),
  useLazyTransactionsGetTransactionByIdV1Query: jest.fn(() => [jest.fn().mockResolvedValue({ data: undefined })]),
}))

jest.mock('@/components/tx/shared/tracking', () => ({
  __esModule: true,
  trackTxEvents: jest.fn(),
}))

describe('TxFlowProvider', () => {
  const createSafeTx = (signatureCount: number) => {
    const signatures = Array.from({ length: signatureCount }, () => safeSignatureBuilder().build())
    return safeTxBuilder()
      .with({ signatures: new Map(signatures.map((signature) => [signature.signer, signature])) })
      .build()
  }

  const renderContext = ({
    txId,
    onContinueToExecute,
    isExecutable,
    safeTx,
  }: {
    txId?: string
    onContinueToExecute?: (txId: string) => void
    isExecutable?: boolean
    safeTx?: SafeTransaction
  }) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <SafeTxContext.Provider value={{ safeTx } as SafeTxContextParams}>
        <TxFlowProvider
          step={0}
          data={undefined}
          prevStep={jest.fn()}
          nextStep={jest.fn()}
          txId={txId}
          onContinueToExecute={onContinueToExecute}
          isExecutable={isExecutable}
        >
          {children}
        </TxFlowProvider>
      </SafeTxContext.Provider>
    )
    return renderHook(() => useContext(TxFlowContext), { wrapper: Wrapper })
  }

  it('exposes the signed transaction id while still treating the flow as a creation', () => {
    const signedTxId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
    const onContinueToExecute = jest.fn()
    const { result } = renderContext({ onContinueToExecute })

    expect(result.current.txId).toBeUndefined()
    expect(result.current.isCreation).toBe(true)

    act(() => result.current.continueToExecute(signedTxId))

    expect(onContinueToExecute).toHaveBeenCalledWith(signedTxId)
    expect(result.current.txId).toBe(signedTxId)
    expect(result.current.isCreation).toBe(true)
    expect(result.current.canExecute).toBe(true)
  })

  it('keeps the id of an existing transaction when continuing to execute', () => {
    const existingTxId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
    const { result } = renderContext({ txId: existingTxId })

    act(() => result.current.continueToExecute(existingTxId))

    expect(result.current.txId).toBe(existingTxId)
    expect(result.current.isCreation).toBe(false)
  })

  describe('trackTxEvent', () => {
    const buildTxId = () => `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
    const isCreationArg = () => jest.mocked(trackTxEvents).mock.calls[0][1]

    beforeEach(() => {
      jest.mocked(trackTxEvents).mockClear()
    })

    it('tracks a new tx as a creation', async () => {
      const { result } = renderContext({})

      await act(() => result.current.trackTxEvent(buildTxId(), true))

      expect(isCreationArg()).toBe(true)
    })

    it('does not track the execute step after signing a new tx as a second creation', async () => {
      const signedTxId = buildTxId()
      const { result } = renderContext({})

      act(() => result.current.continueToExecute(signedTxId))
      await act(() => result.current.trackTxEvent(signedTxId, true))

      expect(isCreationArg()).toBe(false)
      expect(result.current.isCreation).toBe(true)
    })

    it('does not track an existing tx as a creation', async () => {
      const existingTxId = buildTxId()
      const { result } = renderContext({ txId: existingTxId })

      await act(() => result.current.trackTxEvent(existingTxId, true))

      expect(isCreationArg()).toBe(false)
    })
  })

  describe('with the in-app nested Safe signer', () => {
    beforeEach(() => {
      jest.mocked(useSigner).mockReturnValue({
        address: faker.finance.ethereumAddress(),
        chainId: '1',
        provider: null,
        isSafe: true,
      })
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...extendedSafeInfoBuilder().build(), threshold: 1 },
        safeAddress: faker.finance.ethereumAddress(),
        safeLoaded: true,
        safeLoading: false,
      })
    })

    afterEach(() => {
      jest.mocked(useSigner).mockReturnValue(null)
      jest.restoreAllMocks()
    })

    it('does not offer execution of a new unsigned tx', () => {
      const { result } = renderContext({ safeTx: createSafeTx(0) })

      expect(result.current.canExecute).toBe(false)
      expect(result.current.willExecute).toBe(false)
      expect(result.current.willSignBeforeExecute).toBe(false)
    })

    it('does not offer execution of an existing tx still missing signatures', () => {
      const existingTxId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(0) })

      expect(result.current.canExecute).toBe(false)
    })

    it('offers execution of a fully signed tx', () => {
      const existingTxId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(1) })

      expect(result.current.canExecute).toBe(true)
    })
  })

  describe('with an EOA signer', () => {
    const existingTxId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
    const mockThreshold = (threshold: number) =>
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...extendedSafeInfoBuilder().build(), threshold },
        safeAddress: faker.finance.ethereumAddress(),
        safeLoaded: true,
        safeLoading: false,
      })

    const settleSmartContractCheck = () => act(async () => {})

    beforeEach(() => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      jest.mocked(useSigner).mockReturnValue({
        address: faker.finance.ethereumAddress(),
        chainId: '1',
        provider: null,
        isSafe: false,
      })
    })

    afterEach(() => {
      jest.mocked(useSigner).mockReturnValue(null)
      jest.mocked(useAlreadySigned).mockReturnValue(false)
      jest.restoreAllMocks()
    })

    it('signs before executing a new unsigned tx on a 1/n Safe', async () => {
      mockThreshold(1)
      const { result } = renderContext({ safeTx: createSafeTx(0) })

      await waitFor(() => expect(result.current.willSignBeforeExecute).toBe(true))
    })

    it('signs before executing when the signature completes the threshold of an m/n Safe', async () => {
      mockThreshold(3)
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(2) })

      await waitFor(() => expect(result.current.willSignBeforeExecute).toBe(true))
      expect(result.current.canExecute).toBe(true)
    })

    it('does not sign before executing an m/n tx that is still missing other signatures', async () => {
      mockThreshold(3)
      const { result } = renderContext({ txId: existingTxId, isExecutable: false, safeTx: createSafeTx(1) })

      await settleSmartContractCheck()
      expect(result.current.willSignBeforeExecute).toBe(false)
    })

    it('does not sign before executing an m/n tx the signer already signed', async () => {
      mockThreshold(3)
      jest.mocked(useAlreadySigned).mockReturnValue(true)
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(2) })

      await settleSmartContractCheck()
      expect(result.current.willSignBeforeExecute).toBe(false)
    })

    it('does not sign before executing a fully signed m/n tx', async () => {
      mockThreshold(3)
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(3) })

      await settleSmartContractCheck()
      expect(result.current.willSignBeforeExecute).toBe(false)
      expect(result.current.canExecute).toBe(true)
    })

    it('does not offer execution to a smart-contract last signer on an m/n Safe', async () => {
      mockThreshold(3)
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(2) })

      await waitFor(() => expect(result.current.canExecute).toBe(false))
      expect(result.current.willSignBeforeExecute).toBe(false)
    })

    it('offers execution of a fully signed tx to a smart-contract signer', async () => {
      mockThreshold(3)
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(3) })

      await settleSmartContractCheck()
      expect(result.current.canExecute).toBe(true)
    })
  })

  describe('with a Safe connected as the wallet over WalletConnect', () => {
    const existingTxId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`

    beforeEach(() => {
      jest.mocked(useSigner).mockReturnValue({
        address: faker.finance.ethereumAddress(),
        chainId: '1',
        provider: null,
        isConnectedSafe: true,
        threshold: 1,
      })
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { ...extendedSafeInfoBuilder().build(), threshold: 1 },
        safeAddress: faker.finance.ethereumAddress(),
        safeLoaded: true,
        safeLoading: false,
      })
    })

    afterEach(() => {
      jest.mocked(useSigner).mockReturnValue(null)
      jest.restoreAllMocks()
    })

    it('does not offer execution of a new unsigned tx', () => {
      const { result } = renderContext({ safeTx: createSafeTx(0) })

      expect(result.current.canExecute).toBe(false)
      expect(result.current.willExecute).toBe(false)
      expect(result.current.willSignBeforeExecute).toBe(false)
    })

    it('does not offer execution of an existing tx still missing signatures', () => {
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(0) })

      expect(result.current.canExecute).toBe(false)
    })

    it('offers execution of a fully signed tx', () => {
      const { result } = renderContext({ txId: existingTxId, isExecutable: true, safeTx: createSafeTx(1) })

      expect(result.current.canExecute).toBe(true)
    })
  })
})
