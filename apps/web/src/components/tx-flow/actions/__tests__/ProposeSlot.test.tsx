import { type PropsWithChildren, type ReactElement } from 'react'
import { fireEvent, render, renderHook, waitFor } from '@/tests/test-utils'
import TxFlowProvider from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotProvider, SlotName } from '@/components/tx-flow/slots'
import { useSlotIds } from '@/components/tx-flow/slots/hooks'
import ProposeSlot from '../Propose'
import ProposerForm from '../Propose/ProposerForm'
import SignSlot from '../Sign'
import ExecuteSlot from '../Execute'
import { createMockSafeTransaction } from '@/tests/transactions'
import { OperationType } from '@safe-global/types-kit'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useTxActions } from '@/components/tx/shared/hooks'
import { getTxOrigin } from '@/utils/transactions'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useCurrentChain: jest.fn(() => ({ chainId: '1', features: [] })),
  useHasFeature: jest.fn(() => false),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({ address: '0x1234567890000000000000000000000000000009', chainId: '1' })),
  useSigner: jest.fn(() => ({ address: '0x1234567890000000000000000000000000000009' })),
}))

jest.mock('@/features/counterfactual', () => ({ useIsCounterfactualSafe: jest.fn(() => false) }))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShield: jest.fn(() => ({ needsRiskConfirmation: false, isRiskConfirmed: false })),
}))

jest.mock('@/hooks/useTxDetails', () => ({ __esModule: true, default: jest.fn(() => [undefined, undefined, false]) }))

jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: jest.fn() }))

jest.mock('@/hooks/useProposers', () => ({ __esModule: true, default: jest.fn(), useIsWalletProposer: jest.fn() }))

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/components/tx/shared/hooks', () => ({
  __esModule: true,
  useAlreadySigned: jest.fn(() => false),
  useImmediatelyExecutable: jest.fn(() => false),
  useValidateNonce: jest.fn(() => true),
  useIsExecutionLoop: jest.fn(() => false),
  useTxActions: jest.fn(),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

const TX_ORIGIN = getTxOrigin({ url: 'https://apps.safe.global/tx-builder', name: 'Transaction Builder' })

const safeTx = createMockSafeTransaction({ to: '0x1', data: '0x', operation: OperationType.Call })
const safeInfo = extendedSafeInfoBuilder().build()

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseIsSafeOwner = useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>
const mockUseIsWalletProposer = useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>
const mockUseTxActions = useTxActions as jest.MockedFunction<typeof useTxActions>

const signProposerTx = jest.fn()

const safeTxContext: SafeTxContextParams = {
  safeTx,
  setSafeTx: jest.fn(),
  setSafeMessage: jest.fn(),
  setSafeMessageHash: jest.fn(),
  setSafeTxError: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  txOrigin: TX_ORIGIN,
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
}

describe('Propose slot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({
      safe: { ...safeInfo, threshold: 2, nonce: 1 },
      safeAddress: safeInfo.address.value,
      safeLoading: false,
      safeLoaded: true,
      safeError: undefined,
    } as ReturnType<typeof useSafeInfo>)
    mockUseIsSafeOwner.mockReturnValue(false)
    mockUseIsWalletProposer.mockReturnValue(false)
    mockUseTxActions.mockReturnValue({ signProposerTx } as unknown as ReturnType<typeof useTxActions>)
  })

  const createWrapper = ({ txId, isExecutable }: { txId?: string; isExecutable?: boolean } = {}) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <SafeTxContext.Provider value={safeTxContext}>
        <TxFlowProvider
          step={0}
          data={undefined}
          prevStep={jest.fn()}
          nextStep={jest.fn()}
          txId={txId}
          isExecutable={isExecutable}
        >
          <SlotProvider>
            <ProposeSlot />
            <SignSlot />
            <ExecuteSlot />
            {children}
          </SlotProvider>
        </TxFlowProvider>
      </SafeTxContext.Provider>
    )
    return Wrapper
  }

  const renderSlotIds = (wrapperProps?: Parameters<typeof createWrapper>[0]) =>
    renderHook(
      () => ({
        submit: useSlotIds(SlotName.Submit),
        comboSubmit: useSlotIds(SlotName.ComboSubmit),
      }),
      { wrapper: createWrapper(wrapperProps) },
    )

  it('registers Propose for a proposer who is not a signer', () => {
    mockUseIsWalletProposer.mockReturnValue(true)

    const { result } = renderSlotIds()

    expect(result.current.submit).toContain('propose')
    expect(result.current.comboSubmit).not.toContain('sign')
  })

  it('does not register Propose for a signer who is also a proposer', () => {
    mockUseIsSafeOwner.mockReturnValue(true)
    mockUseIsWalletProposer.mockReturnValue(true)

    const { result } = renderSlotIds()

    expect(result.current.submit).not.toContain('propose')
    expect(result.current.comboSubmit).toContain('sign')
  })

  it('does not register Propose for a wallet that is neither a signer nor a proposer', () => {
    const { result } = renderSlotIds()

    expect(result.current.submit).not.toContain('propose')
  })

  it('does not register Propose when confirming an existing transaction', () => {
    mockUseIsWalletProposer.mockReturnValue(true)

    const { result } = renderSlotIds({ txId: 'multisig_0x1_0x2' })

    expect(result.current.submit).not.toContain('propose')
  })

  it('never offers Execute to a proposer, even for an executable transaction', () => {
    mockUseIsWalletProposer.mockReturnValue(true)

    const { result } = renderSlotIds({ isExecutable: true })

    expect(result.current.submit).toContain('propose')
    expect(result.current.comboSubmit).not.toContain('execute')
  })

  describe('ProposerForm', () => {
    it('proposes the transaction with the Safe App origin', async () => {
      signProposerTx.mockResolvedValue('multisig_0x1_0x2')
      const onSubmit = jest.fn()

      const { getByTestId } = render(<ProposerForm safeTx={safeTx} origin={TX_ORIGIN} onSubmit={onSubmit} />)

      fireEvent.click(getByTestId('sign-btn'))

      await waitFor(() => {
        expect(signProposerTx).toHaveBeenCalledWith(safeTx, TX_ORIGIN)
        expect(onSubmit).toHaveBeenCalledWith('multisig_0x1_0x2')
      })
    })

    it('disables the submit button while the transaction is not built yet', () => {
      const { getByTestId } = render(<ProposerForm origin={TX_ORIGIN} onSubmit={jest.fn()} />)

      expect(getByTestId('sign-btn')).toBeDisabled()
    })
  })
})
