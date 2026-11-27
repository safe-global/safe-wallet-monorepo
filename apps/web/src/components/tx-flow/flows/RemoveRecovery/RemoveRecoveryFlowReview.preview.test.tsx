import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createSafeTx } from '@/tests/builders/safeTx'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { SlotProvider } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import type { RecoveryStateItem } from '@/features/recovery/public/types'
import { createRemoveModuleTx } from '@/services/tx/tx-sender/create'
import { RemoveRecoveryFlowReview } from './RemoveRecoveryFlowReview'

jest.mock('@/services/tx/tx-sender/create', () => ({
  ...jest.requireActual('@/services/tx/tx-sender/create'),
  createRemoveModuleTx: jest.fn(),
}))

jest.mock('@/features/safe-shield/public/hooks/useSafeShield', () => ({
  ...jest.requireActual('@/features/safe-shield/public/hooks/useSafeShield'),
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: false }),
}))

const delayModifier: RecoveryStateItem = {
  address: fakerChecksummedAddress(),
  recoverers: [fakerChecksummedAddress()],
  expiry: BigInt(0),
  delay: BigInt(0),
  txNonce: BigInt(0),
  queueNonce: BigInt(0),
  queue: [],
}
const safeTx = createSafeTx()

const preview = {
  txInfo: {
    type: TransactionInfoType.SETTINGS_CHANGE,
    settingsInfo: { type: SettingsInfoType.DISABLE_MODULE, module: { value: delayModifier.address } },
  },
  txData: { to: { value: safeTx.data.to }, value: '0', operation: Operation.CALL, hexData: safeTx.data.data },
} as unknown as TransactionPreview

describe('RemoveRecoveryFlowReview in the real transaction review', () => {
  beforeEach(() => {
    jest.mocked(createRemoveModuleTx).mockResolvedValue(safeTx)
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(preview),
      ),
    )
  })

  it('explains the removal with the recoverers, without a separate "Disable module" block', async () => {
    render(
      <SlotProvider>
        <SafeTxContext.Provider
          value={{ safeTx, setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}
        >
          <RemoveRecoveryFlowReview delayModifier={delayModifier} onSubmit={jest.fn()} />
        </SafeTxContext.Provider>
      </SlotProvider>,
      { initialReduxState: { safeInfo: { data: extendedSafeInfoBuilder().build(), loaded: true, loading: false } } },
    )

    expect(await screen.findByText('Transaction details')).toBeInTheDocument()
    expect(screen.getByText('Removing Recoverer')).toBeInTheDocument()
    expect(screen.queryByText('Disable module:')).not.toBeInTheDocument()
  })
})
