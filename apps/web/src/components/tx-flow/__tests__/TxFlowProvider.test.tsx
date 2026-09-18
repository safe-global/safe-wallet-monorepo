import { type PropsWithChildren, useContext } from 'react'
import { act, renderHook } from '@/tests/test-utils'
import TxFlowProvider, { TxFlowContext } from '../TxFlowProvider'
import { faker } from '@faker-js/faker'

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

describe('TxFlowProvider', () => {
  const renderContext = ({
    txId,
    onContinueToExecute,
  }: {
    txId?: string
    onContinueToExecute?: (txId: string) => void
  }) => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <TxFlowProvider
        step={0}
        data={undefined}
        prevStep={jest.fn()}
        nextStep={jest.fn()}
        txId={txId}
        onContinueToExecute={onContinueToExecute}
      >
        {children}
      </TxFlowProvider>
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
})
