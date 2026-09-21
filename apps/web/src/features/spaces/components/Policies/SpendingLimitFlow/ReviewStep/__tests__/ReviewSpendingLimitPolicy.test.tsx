import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { render, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { REVIEW_PLACEHOLDER_TEXT, REVIEW_STEP_TITLE } from '../../constants'
import type { SpendingLimitPolicyFormValues } from '../../types'
import ReviewSpendingLimitPolicy from '..'

jest.mock('@/components/tx-flow/TxFlowStep', () => ({ TxFlowStep: jest.fn(({ children }) => <>{children}</>) }))

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SPENDER_A = '0x1234567890123456789012345678901234567890'

const data: SpendingLimitPolicyFormValues = {
  safe: `1:${SAFE_A}`,
  spenders: [{ address: SPENDER_A, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '1', resetTime: '0' }] }],
}

const renderReview = () =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, data } as TxFlowContextType}>
      <ReviewSpendingLimitPolicy />
    </TxFlowContext.Provider>,
  )

// A stand-in until WA-3151 builds the real summary, so these only pin what it is here to do:
// prove the form's values arrived, and say that signing is not possible yet.
describe('ReviewSpendingLimitPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('says that signing is not available yet', () => {
    renderReview()

    expect(screen.getByText(REVIEW_PLACEHOLDER_TEXT)).toBeInTheDocument()
  })

  it('shows the values step 1 handed over', () => {
    renderReview()

    const raw = screen.getByTestId('review-raw-values')
    expect(raw).toHaveTextContent(SAFE_A)
    expect(raw).toHaveTextContent(SPENDER_A)
  })

  it('hides the nonce, since there is no transaction to place yet', () => {
    renderReview()

    expect(TxFlowStep).toHaveBeenCalledWith(
      expect.objectContaining({ title: REVIEW_STEP_TITLE, hideNonce: true }),
      undefined,
    )
  })
})
