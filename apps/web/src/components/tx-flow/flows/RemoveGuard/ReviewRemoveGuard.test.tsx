import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, fireEvent, render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createSafeTx } from '@/tests/builders/safeTx'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { SlotProvider } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { createRemoveGuardTx } from '@/services/tx/tx-sender/create'
import { ReviewRemoveGuard } from './ReviewRemoveGuard'

jest.mock('@/services/tx/tx-sender/create', () => ({
  ...jest.requireActual('@/services/tx/tx-sender/create'),
  createRemoveGuardTx: jest.fn(),
}))

jest.mock('@/features/safe-shield/public/hooks/useSafeShield', () => ({
  ...jest.requireActual('@/features/safe-shield/public/hooks/useSafeShield'),
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: false }),
}))

const guardAddress = fakerChecksummedAddress()
const safeTx = createSafeTx()

const preview = {
  txInfo: { type: TransactionInfoType.SETTINGS_CHANGE, settingsInfo: { type: SettingsInfoType.DELETE_GUARD } },
  txData: {
    to: { value: safeTx.data.to },
    value: '0',
    operation: Operation.CALL,
    hexData: safeTx.data.data,
    dataDecoded: { method: 'setGuard', parameters: [] },
  },
} as unknown as TransactionPreview

const renderReview = () =>
  render(
    <SlotProvider>
      <SafeTxContext.Provider
        value={{ safeTx, setSafeTx: jest.fn(), setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}
      >
        <ReviewRemoveGuard params={{ address: guardAddress }} onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </SlotProvider>,
    { initialReduxState: { safeInfo: { data: extendedSafeInfoBuilder().build(), loaded: true, loading: false } } },
  )

describe('ReviewRemoveGuard', () => {
  beforeEach(() => {
    jest.mocked(createRemoveGuardTx).mockResolvedValue(safeTx)
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(preview),
      ),
    )
  })

  it('shows the guard to remove once', async () => {
    renderReview()

    expect(await screen.findByText('Transaction guard')).toBeInTheDocument()
    expect(screen.getByText('Transaction details')).toBeInTheDocument()
    expect(screen.getAllByText(guardAddress)).toHaveLength(1)
    expect(screen.queryByText('Delete guard')).not.toBeInTheDocument()
  })

  it('keeps the removal warning and the decoded setGuard call', async () => {
    renderReview()

    expect(await screen.findByText(/checks by the transaction guard will not be conducted/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Transaction details'))
    expect(await screen.findByText('setGuard', { selector: 'code' })).toBeInTheDocument()
  })
})
