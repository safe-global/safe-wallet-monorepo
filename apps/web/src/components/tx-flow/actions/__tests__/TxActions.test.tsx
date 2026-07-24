import { render as renderTestUtils } from '@/tests/test-utils'
import { TxActions } from '../TxActions'
import { initialContext, TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import { SlotProvider } from '@/components/tx-flow/slots'
import useSafeInfo from '@/hooks/useSafeInfo'

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

describe('TxActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeInfo.mockReturnValue({
      safe: {
        address: { value: '0xSafeAddress' },
        chainId: '1',
        threshold: 1,
        nonce: 1,
        owners: [{ value: '0xOwner1' }],
      },
      safeAddress: '0xSafeAddress',
    } as any)
  })

  it('mounts the submit actions bundle without crashing', () => {
    const { container } = renderTestUtils(
      <TxFlowContext.Provider value={{ ...initialContext }}>
        <SafeTxContext.Provider value={{ safeTx: undefined } as any}>
          <SafeShieldProvider>
            <SlotProvider>
              <TxActions onSubmit={jest.fn()} />
            </SlotProvider>
          </SafeShieldProvider>
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>,
    )

    expect(container).toBeInTheDocument()
  })
})
