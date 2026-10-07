import type { ReactNode } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import type Safe from '@safe-global/protocol-kit'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { render, screen, waitFor } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxContext'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeScope } from '@/components/tx-flow/safe-scope'
import { mockUnenforcedPolicy } from '../../../mocks/policies'
import { MODULE_ALREADY_ENABLED_ERROR, REVIEW_STEP_TITLE, UNKNOWN_MODULE_ERROR } from '../../constants'
import ReviewEnableModule, { type EnableModuleFlowData } from '../ReviewEnableModule'

jest.mock('@/components/tx-flow/TxFlowStep', () => ({ TxFlowStep: jest.fn(({ children }) => <>{children}</>) }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: jest.fn(({ title, children }: { title?: string; children?: ReactNode }) => (
    <div data-testid="review-transaction" data-title={title}>
      {children}
    </div>
  )),
}))
jest.mock('@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="review-skeleton" />,
}))
jest.mock('@/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/hooks/useAddressBook', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})
jest.mock('../../hooks/useSpendingLimitSafeAccounts', () => ({
  useSpendingLimitSafeAccounts: () => ({ accounts: [], isLoading: false, isError: false, hasWallet: true }),
}))

const SAFE = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const MODULE = getAllowanceModuleDeployment({ version: '0.1.0' })?.networkAddresses['1'] as string
const OTHER_MODULE = '0x000000000000000000000000000000000000dEaD'

const builtTx = { data: { to: SAFE } } as unknown as SafeTransaction
const createEnableModuleTx = jest.fn()
const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()
const mockUseSafeScope = useSafeScope as jest.MockedFunction<typeof useSafeScope>
const sdk = { createEnableModuleTx } as unknown as Safe

const scopeWith = (modules: string[] = [OTHER_MODULE]) => ({
  chainId: '1',
  safeAddress: SAFE,
  scopeKey: `1:${SAFE}` as const,
  safeLoaded: true,
  safeLoading: false,
  safe: extendedSafeInfoBuilder()
    .with({ chainId: '1', address: { value: SAFE }, modules: modules.map((value) => ({ value })) })
    .build(),
  sdk,
})

const safeTxContext = (overrides: Partial<SafeTxContextParams> = {}): SafeTxContextParams => ({
  setSafeTx,
  setSafeTxError,
  setSafeMessage: jest.fn(),
  setSafeMessageHash: jest.fn(),
  setNonce: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
  ...overrides,
})

const renderReview = (moduleAddress = MODULE, safeTxOverrides: Partial<SafeTxContextParams> = {}) => {
  const policy = mockUnenforcedPolicy()
  const data: EnableModuleFlowData = { safe: policy.safe, moduleAddress, spenders: policy.data.spenders }

  const tree = () => (
    <TxFlowContext.Provider value={{ ...initialContext, data } as TxFlowContextType}>
      <SafeTxContext.Provider value={safeTxContext(safeTxOverrides)}>
        <ReviewEnableModule onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>
  )
  const utils = render(tree())

  return { ...utils, rerenderReview: () => utils.rerender(tree()) }
}

describe('ReviewEnableModule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeScope.mockReturnValue(scopeWith())
    createEnableModuleTx.mockResolvedValue(builtTx)
  })

  it('builds a transaction that only enables the policy module', async () => {
    renderReview()

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(createEnableModuleTx).toHaveBeenCalledTimes(1)
    expect(createEnableModuleTx).toHaveBeenCalledWith(MODULE)
  })

  it('refuses a module that is not a known AllowanceModule on the chain', () => {
    renderReview(OTHER_MODULE)

    expect(createEnableModuleTx).not.toHaveBeenCalled()
    expect(setSafeTxError).toHaveBeenLastCalledWith(new Error(UNKNOWN_MODULE_ERROR))
  })

  it('refuses a module the Safe already has enabled, whose enableModule would revert', () => {
    mockUseSafeScope.mockReturnValue(scopeWith([MODULE.toLowerCase()]))

    renderReview()

    expect(createEnableModuleTx).not.toHaveBeenCalled()
    expect(setSafeTxError).toHaveBeenLastCalledWith(new Error(MODULE_ALREADY_ENABLED_ERROR))
  })

  it('re-checks when another module is swapped for the policy module while the flow is open', async () => {
    const { rerenderReview } = renderReview()
    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))

    mockUseSafeScope.mockReturnValue(scopeWith([MODULE]))
    rerenderReview()

    expect(setSafeTxError).toHaveBeenLastCalledWith(new Error(MODULE_ALREADY_ENABLED_ERROR))
    expect(createEnableModuleTx).toHaveBeenCalledTimes(1)
  })

  it('reports a failed build', async () => {
    const error = new Error('rpc down')
    createEnableModuleTx.mockRejectedValue(error)

    renderReview()

    await waitFor(() => expect(setSafeTxError).toHaveBeenLastCalledWith(error))
    expect(setSafeTx).not.toHaveBeenCalledWith(expect.anything())
  })

  it('waits for the Safe SDK before building', () => {
    mockUseSafeScope.mockReturnValue({ ...scopeWith(), sdk: undefined })

    renderReview()

    expect(createEnableModuleTx).not.toHaveBeenCalled()
    expect(screen.getByTestId('review-skeleton')).toBeInTheDocument()
  })

  it('shows the same policy summary as the setup and edit flows', () => {
    renderReview(MODULE, { safeTx: builtTx })

    expect(screen.getByTestId('review-transaction')).toHaveAttribute('data-title', REVIEW_STEP_TITLE)
    expect(screen.getByTestId('spending-limit-summary')).toBeInTheDocument()
    expect(screen.getByTestId('spending-limit-summary-callout')).toBeInTheDocument()
  })
})
