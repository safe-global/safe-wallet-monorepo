import SuccessScreen from '@/components/tx-flow/flows/SuccessScreen'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useChainsHook from '@/hooks/useChains'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { PendingStatus, PendingTxType, type PendingTxsState } from '@/store/pendingTxsSlice'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { act, render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useTxDetails', () => ({
  __esModule: true,
  default: () => [undefined, undefined, false],
}))

const TEST_CHAIN_ID = '11155111'
const TEST_SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'
const TX_ID = 'multisig_0xabc'

const processingTxs: PendingTxsState = {
  [TX_ID]: {
    chainId: TEST_CHAIN_ID,
    safeAddress: TEST_SAFE_ADDRESS,
    nonce: 1,
    status: PendingStatus.PROCESSING,
    txHash: '0xdeadbeef',
    submittedAt: Date.now(),
    signerNonce: 7,
    signerAddress: faker.finance.ethereumAddress(),
    txType: PendingTxType.SAFE_TX,
  },
}

const dispatchReverted = (txId: string | undefined) =>
  act(() => {
    txDispatch(TxEvent.REVERTED, {
      nonce: 1,
      txId,
      groupKey: 'group',
      chainId: TEST_CHAIN_ID,
      safeAddress: TEST_SAFE_ADDRESS,
      error: new Error('Transaction reverted by EVM.'),
    })
  })

describe('SuccessScreen', () => {
  const originalAnimationApi: Record<string, PropertyDescriptor | undefined> = {
    getAnimations: Object.getOwnPropertyDescriptor(Element.prototype, 'getAnimations'),
    animate: Object.getOwnPropertyDescriptor(Element.prototype, 'animate'),
  }

  beforeAll(() => {
    // jsdom does not implement the Web Animations API used by the status spinner
    Object.defineProperty(Element.prototype, 'getAnimations', { value: () => [], writable: true })
    Object.defineProperty(Element.prototype, 'animate', { value: () => undefined, writable: true })
  })

  afterAll(() => {
    for (const [name, descriptor] of Object.entries(originalAnimationApi)) {
      if (descriptor) {
        Object.defineProperty(Element.prototype, name, descriptor)
      } else {
        delete (Element.prototype as unknown as Record<string, unknown>)[name]
      }
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(TEST_CHAIN_ID)
    jest
      .spyOn(useChainsHook, 'useCurrentChain')
      .mockReturnValue(chainBuilder().with({ chainId: TEST_CHAIN_ID }).build())
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: { ...extendedSafeInfoBuilder().build(), chainId: TEST_CHAIN_ID },
      safeAddress: TEST_SAFE_ADDRESS,
      safeError: undefined,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('shows the processing status while the transaction is pending', () => {
    render(<SuccessScreen txId={TX_ID} />, { initialReduxState: { pendingTxs: processingTxs } })

    expect(screen.getByTestId('transaction-status')).toHaveTextContent('Transaction is now processing')
  })

  it('leaves the processing status for the error status when the transaction reverts', () => {
    render(<SuccessScreen txId={TX_ID} />, { initialReduxState: { pendingTxs: processingTxs } })

    dispatchReverted(TX_ID)

    // The tx is mined, so it must not keep offering "Speed up" via the processing status
    expect(screen.getByTestId('transaction-status')).toHaveTextContent('Transaction failed')
    expect(screen.getByText('Transaction reverted by EVM.')).toBeInTheDocument()
  })

  it('shows the error even if the pending tx was already cleared from the store', () => {
    render(<SuccessScreen txId={TX_ID} />, { initialReduxState: { pendingTxs: {} } })

    dispatchReverted(TX_ID)

    expect(screen.getByTestId('transaction-status')).toHaveTextContent('Transaction failed')
    expect(screen.getByText('Transaction reverted by EVM.')).toBeInTheDocument()
  })

  it('ignores events belonging to another transaction', () => {
    render(<SuccessScreen txId={TX_ID} />, { initialReduxState: { pendingTxs: {} } })

    dispatchReverted('multisig_0xother')

    expect(screen.getByTestId('transaction-status')).toHaveTextContent('Transaction was successful')
  })

  it('ignores events without a txId when rendered for a module transaction', () => {
    render(<SuccessScreen txHash="0xdeadbeef" />, { initialReduxState: { pendingTxs: {} } })

    dispatchReverted(undefined)

    // A module tx renders the indexing status; a `groupKey`-only failure must not hijack it
    expect(screen.getByTestId('transaction-status')).toHaveTextContent('Transaction was processed')
  })
})
