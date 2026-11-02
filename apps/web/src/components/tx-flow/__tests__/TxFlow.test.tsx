import type { PropsWithChildren } from 'react'
import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { TxFlow } from '../TxFlow'
import TxFlowProvider from '../TxFlowProvider'

jest.mock('../SafeTxProvider', () => ({
  __esModule: true,
  default: ({ children }: PropsWithChildren) => <>{children}</>,
}))
jest.mock('../TxInfoProvider', () => ({ TxInfoProvider: ({ children }: PropsWithChildren) => <>{children}</> }))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  SafeShieldProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}))
jest.mock('../../../../../../packages/views/src/components/tx-flow/slots/SlotProvider', () => ({
  SlotProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}))
jest.mock('../TxFlowProvider', () => ({
  __esModule: true,
  default: jest.fn(({ children }: PropsWithChildren) => <>{children}</>),
}))
jest.mock('../common/TxFlowContent', () => ({
  TxFlowContent: ({ children }: PropsWithChildren) => <>{children}</>,
}))
jest.mock('../useTxStepper', () => ({
  __esModule: true,
  default: () => ({ step: 0, data: undefined, nextStep: jest.fn(), prevStep: jest.fn() }),
}))
jest.mock('@/components/tx/shared/tracking', () => ({ useTrackTimeSpent: () => jest.fn() }))
jest.mock('@/features/__core__/useLoadFeature', () => ({
  useLoadFeature: () => ({ LedgerHashComparison: () => null }),
}))
jest.mock('../features/TxNote', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../features/SignerSelect', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../features/BalanceChanges', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../features/FeeInfoBanner', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../features/FeesPreview', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../features/RiskConfirmation', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/Batching', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/ComboSubmit', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/Counterfactual', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/Execute', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/ExecuteThroughRole', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/Propose', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('../actions/Sign', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: () => <div data-testid="review-step" />,
}))
jest.mock('@/components/tx/ConfirmTxReceipt', () => ({
  ConfirmTxReceipt: () => <div data-testid="confirm-receipt-step" />,
}))
jest.mock('@/components/tx/ExecuteTxStep', () => ({
  ExecuteTxStep: ({ afterSigning }: { afterSigning?: boolean }) => (
    <div data-testid="execute-step" data-after-signing={String(!!afterSigning)} />
  ),
}))

describe('TxFlow', () => {
  const txId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`

  it.each([true, false])('passes isBatchable=%s to the flow provider', (isBatchable) => {
    render(<TxFlow isBatchable={isBatchable} />)

    expect(jest.mocked(TxFlowProvider).mock.lastCall?.[0]).toMatchObject({ isBatchable })
  })

  it('renders the signing receipt for a new transaction', () => {
    render(<TxFlow />)

    expect(screen.getByTestId('confirm-receipt-step')).toBeInTheDocument()
    expect(screen.queryByTestId('execute-step')).not.toBeInTheDocument()
  })

  it('renders the signing receipt for a queued transaction the wallet can still sign', () => {
    render(<TxFlow txId={txId} isExecutable onlyExecute={false} />)

    expect(screen.getByTestId('confirm-receipt-step')).toBeInTheDocument()
    expect(screen.queryByTestId('execute-step')).not.toBeInTheDocument()
  })

  it('renders the signing receipt for a queued transaction that is not executable yet', () => {
    render(<TxFlow txId={txId} isExecutable={false} onlyExecute />)

    expect(screen.getByTestId('confirm-receipt-step')).toBeInTheDocument()
    expect(screen.queryByTestId('execute-step')).not.toBeInTheDocument()
  })

  it('replaces the signing receipt with the execute step for a fully signed executable queued transaction', () => {
    render(<TxFlow txId={txId} isExecutable onlyExecute />)

    expect(screen.queryByTestId('confirm-receipt-step')).not.toBeInTheDocument()
    expect(screen.getByTestId('execute-step')).toHaveAttribute('data-after-signing', 'false')
  })
})
