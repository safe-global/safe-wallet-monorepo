import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createSafeTx } from '@/tests/builders/safeTx'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotProvider } from '@/components/tx-flow/slots'
import { createRemoveModuleTx } from '@/services/tx/tx-sender'
import { ReviewRemoveModule } from './ReviewRemoveModule'

jest.mock('@/services/tx/tx-sender', () => ({
  ...jest.requireActual('@/services/tx/tx-sender'),
  createRemoveModuleTx: jest.fn(),
}))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  ...jest.requireActual('@/features/safe-shield/SafeShieldContext'),
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: false }),
}))

const moduleAddress = fakerChecksummedAddress()
const safeTx = createSafeTx()

const preview = {
  txInfo: {
    type: TransactionInfoType.SETTINGS_CHANGE,
    settingsInfo: { type: SettingsInfoType.DISABLE_MODULE, module: { value: moduleAddress } },
  },
  txData: { to: { value: safeTx.data.to }, value: '0', operation: Operation.CALL, hexData: safeTx.data.data },
} as unknown as TransactionPreview

describe('ReviewRemoveModule', () => {
  beforeEach(() => {
    jest.mocked(createRemoveModuleTx).mockResolvedValue(safeTx)
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(preview),
      ),
    )
  })

  it('shows the module to remove once', async () => {
    render(
      <SlotProvider>
        <SafeTxContext.Provider
          value={{ safeTx, setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}
        >
          <ReviewRemoveModule params={{ address: moduleAddress }} onSubmit={jest.fn()} />
        </SafeTxContext.Provider>
      </SlotProvider>,
      { initialReduxState: { safeInfo: { data: extendedSafeInfoBuilder().build(), loaded: true, loading: false } } },
    )

    expect(await screen.findByText('Module')).toBeInTheDocument()
    expect(screen.getByText('Transaction details')).toBeInTheDocument()
    expect(screen.getAllByText(moduleAddress)).toHaveLength(1)
  })
})
