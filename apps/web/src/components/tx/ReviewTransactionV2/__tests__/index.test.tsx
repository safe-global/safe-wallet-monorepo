import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import ReviewTransaction from '../index'
import { render, waitFor } from '@/tests/test-utils'
import type { SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import { SlotProvider } from '@/components/tx-flow/slots'
import { server } from '@/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const mockTxPreview: TransactionPreview = {
  txInfo: {},
  txData: {
    to: { value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67' },
    operation: 0,
  },
} as unknown as TransactionPreview

const mockSafeAddress = '0x1234567890123456789012345678901234567890'
const mockChainId = '4'

jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
  safe: extendedSafeInfoBuilder()
    .with({
      chainId: mockChainId,
      address: { value: mockSafeAddress, name: 'Test Safe', logoUri: null },
    })
    .build(),
  safeAddress: mockSafeAddress,
  safeLoaded: true,
  safeLoading: false,
  safeError: undefined,
})

describe('ReviewTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display a loading component', () => {
    const { container } = render(<ReviewTransaction onSubmit={jest.fn()} />)

    expect(container).toMatchSnapshot()
  })

  it('should display a confirmation screen', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(mockTxPreview),
      ),
    )

    const { container, getByText } = render(
      <SlotProvider>
        <SafeTxContext.Provider value={{ safeTx: createSafeTx() } as SafeTxContextParams}>
          <SafeShieldProvider>
            <ReviewTransaction onSubmit={jest.fn()} />
          </SafeShieldProvider>
        </SafeTxContext.Provider>
      </SlotProvider>,
    )

    await waitFor(() => {
      expect(getByText("You're about to confirm this transaction.")).toBeInTheDocument()
    })
    expect(container).toMatchSnapshot()
  })

  it('should display an error screen', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () => HttpResponse.error()),
    )

    const { container } = render(
      <SlotProvider>
        <SafeTxContext.Provider
          value={
            {
              safeTx: createSafeTx(),
            } as SafeTxContextParams
          }
        >
          <SafeShieldProvider>
            <ReviewTransaction onSubmit={jest.fn()} />
          </SafeShieldProvider>
        </SafeTxContext.Provider>
      </SlotProvider>,
    )

    await waitFor(() => {
      expect(container.querySelector('[data-testid="error-transaction-preview"]')).toBeInTheDocument()
    })

    expect(container).toMatchSnapshot()
  })
})
