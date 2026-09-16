import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { render, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import useSpendingLimitTokenOptions from '../../hooks/useSpendingLimitTokenOptions'
import { tokenOptionBuilder } from '../../utils/testBuilders'
import { REVIEW_PLACEHOLDER_TEXT, REVIEW_STEP_TITLE } from '../../constants'
import type { SpendingLimitPolicyFormValues } from '../../types'
import ReviewSpendingLimitPolicy from '..'

jest.mock('../../hooks/useSpendingLimitTokenOptions', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '1' }))
jest.mock('@/components/tx-flow/TxFlowStep', () => ({ TxFlowStep: jest.fn(({ children }) => <>{children}</>) }))

const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SPENDER_A = '0x1234567890123456789012345678901234567890'
const SPENDER_B = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const UNKNOWN_TOKEN = '0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB'

const eth = tokenOptionBuilder().with({ address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', group: 'held' }).build()

const data: SpendingLimitPolicyFormValues = {
  safe: `1:${SAFE_A}`,
  spenders: [
    { address: SPENDER_A, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '0' }] },
    { address: SPENDER_B, limits: [{ tokenAddress: UNKNOWN_TOKEN, amount: '25', resetTime: '1440' }] },
  ],
}

const renderReview = () =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, data } as TxFlowContextType}>
      <ReviewSpendingLimitPolicy />
    </TxFlowContext.Provider>,
  )

describe('ReviewSpendingLimitPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    mockUseOptions.mockReturnValue({
      options: [eth],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isPopularLoading: false,
      isPopularError: false,
      refetchPopular: jest.fn(),
      identityKey: `1:${SAFE_A}`,
    })
  })

  it('lists every spender with its limits, amount, token and frequency', () => {
    renderReview()

    expect(screen.getByTestId('review-spending-limit-policy')).toBeInTheDocument()

    const spenders = screen.getAllByTestId('review-spender')
    expect(spenders).toHaveLength(2)
    expect(screen.getAllByTestId('review-limit')[0]).toHaveTextContent('1 ETH')
    expect(screen.getAllByTestId('review-limit')[0]).toHaveTextContent('One time')
    expect(screen.getAllByTestId('review-limit')[1]).toHaveTextContent('1 day')
  })

  it('falls back to the shortened address for a token the list does not know', () => {
    renderReview()

    expect(screen.getAllByTestId('review-limit')[1]).toHaveTextContent('0x4B08')
  })

  it('states that reviewing and signing are not available yet and offers no primary action', () => {
    renderReview()

    expect(screen.getByText(REVIEW_PLACEHOLDER_TEXT)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue|sign|execute|next/i })).not.toBeInTheDocument()
  })

  it('hides the nonce on its own layout step, since layout props do not carry over from the Create step', () => {
    renderReview()

    expect((TxFlowStep as jest.Mock).mock.calls[0][0]).toMatchObject({
      title: REVIEW_STEP_TITLE,
      hideNonce: true,
    })
  })
})
