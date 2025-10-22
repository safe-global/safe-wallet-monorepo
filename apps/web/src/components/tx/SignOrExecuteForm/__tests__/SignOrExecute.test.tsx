import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import SignOrExecute from '../index'
import { render, waitFor } from '@/tests/test-utils'
import type { SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import { server } from '@/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import type { RootState } from '@/store'

let isSafeOwner = true
// mock useIsSafeOwner
jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => isSafeOwner),
}))

// Mock proposeTx
jest.mock('@/services/tx/proposeTransaction', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ id: '123' })),
}))

jest.mock('@/hooks/useValidateTxData', () => ({
  __esModule: true,
  useValidateTxData: jest.fn().mockReturnValue([undefined, undefined, false]),
}))

const mockTxPreview: TransactionPreview = {
  txInfo: {},
  txData: {
    to: { value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67' },
    operation: 0,
  },
} as unknown as TransactionPreview

const mockSafeAddress = '0x1234567890123456789012345678901234567890'
const mockChainId = '1'

const createMockSafeState = (): Partial<RootState> => ({
  safeInfo: {
    data: {
      address: { value: mockSafeAddress },
      chainId: mockChainId,
      nonce: 0,
      threshold: 1,
      owners: [{ value: '0x1111111111111111111111111111111111111111' }],
      implementation: { value: '0x' },
      implementationVersionState: 'UP_TO_DATE',
      modules: [],
      guard: null,
      fallbackHandler: { value: '0x' },
      version: '1.3.0',
      collectiblesTag: '',
      txQueuedTag: '',
      txHistoryTag: '',
      messagesTag: '',
      deployed: true,
    },
    loaded: true,
    loading: false,
  },
})

describe('SignOrExecute', () => {
  beforeEach(() => {
    isSafeOwner = true
    jest.clearAllMocks()
  })

  it('should display a loading component', () => {
    const { container } = render(<SignOrExecute onSubmit={jest.fn()} isExecutable={true} />, {
      initialReduxState: createMockSafeState(),
    })

    expect(container).toMatchSnapshot()
  })

  it('should display a confirmation screen', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () =>
        HttpResponse.json(mockTxPreview),
      ),
    )

    const { container, getByTestId } = render(
      <SafeTxContext.Provider
        value={
          {
            safeTx: createSafeTx(),
          } as SafeTxContextParams
        }
      >
        <SignOrExecute onSubmit={jest.fn()} isExecutable={true} />
      </SafeTxContext.Provider>,
      {
        initialReduxState: createMockSafeState(),
      },
    )

    await waitFor(() => {
      expect(getByTestId('sign-btn')).toBeInTheDocument()
    })
    expect(container).toMatchSnapshot()
  })

  it('should display an error screen', async () => {
    server.use(
      http.post(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`, () => HttpResponse.error()),
    )

    const { container } = render(
      <SafeTxContext.Provider
        value={
          {
            safeTx: createSafeTx(),
          } as SafeTxContextParams
        }
      >
        <SignOrExecute onSubmit={jest.fn()} isExecutable={true} />
      </SafeTxContext.Provider>,
      {
        initialReduxState: createMockSafeState(),
      },
    )

    await waitFor(() => {
      expect(container.querySelector('sign-btn')).not.toBeInTheDocument()
    })
    expect(container).toMatchSnapshot()
  })
})
