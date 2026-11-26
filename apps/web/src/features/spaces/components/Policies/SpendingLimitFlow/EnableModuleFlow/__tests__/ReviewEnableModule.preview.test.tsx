import type Safe from '@safe-global/protocol-kit'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createSafeTx } from '@/tests/builders/safeTx'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { SlotProvider } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { mockUnenforcedPolicy } from '../../../../../public/utils/policies'
import ReviewEnableModule, { type EnableModuleFlowData } from '../ReviewEnableModule'

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
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
jest.mock('@/features/safe-shield/public/hooks/useSafeShield', () => ({
  ...jest.requireActual('@/features/safe-shield/public/hooks/useSafeShield'),
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: false }),
}))

const SAFE = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const MODULE = getAllowanceModuleDeployment({ version: '0.1.0' })?.networkAddresses['1'] as string
const safeTx = createSafeTx()
const safe = extendedSafeInfoBuilder()
  .with({ chainId: '1', address: { value: SAFE }, modules: [] })
  .build()

const preview = {
  txInfo: {
    type: TransactionInfoType.SETTINGS_CHANGE,
    settingsInfo: { type: SettingsInfoType.ENABLE_MODULE, module: { value: MODULE } },
  },
  txData: { to: { value: SAFE }, value: '0', operation: Operation.CALL, hexData: safeTx.data.data },
} as unknown as TransactionPreview

describe('ReviewEnableModule in the real transaction review', () => {
  beforeEach(() => {
    jest.mocked(useSafeScope).mockReturnValue({
      chainId: '1',
      safeAddress: SAFE,
      scopeKey: `1:${SAFE}`,
      safeLoaded: true,
      safeLoading: false,
      safe,
      sdk: { createEnableModuleTx: jest.fn().mockResolvedValue(safeTx) } as unknown as Safe,
    } as unknown as ReturnType<typeof useSafeScope>)
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(preview),
      ),
    )
  })

  it('shows the policy summary without a separate "Enable module" block', async () => {
    const policy = mockUnenforcedPolicy()
    const data: EnableModuleFlowData = { safe: policy.safe, moduleAddress: MODULE, spenders: policy.data.spenders }

    render(
      <SlotProvider>
        <TxFlowContext.Provider value={{ ...initialContext, data } as TxFlowContextType}>
          <SafeTxContext.Provider
            value={{ safeTx, setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}
          >
            <ReviewEnableModule onSubmit={jest.fn()} />
          </SafeTxContext.Provider>
        </TxFlowContext.Provider>
      </SlotProvider>,
      { initialReduxState: { safeInfo: { data: safe, loaded: true, loading: false } } },
    )

    expect(await screen.findByText('Transaction details')).toBeInTheDocument()
    expect(screen.getByTestId('spending-limit-summary')).toBeInTheDocument()
    expect(screen.queryByText('Enable module:')).not.toBeInTheDocument()
  })
})
