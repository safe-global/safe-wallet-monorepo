import { render } from '@/tests/test-utils'
import { GUARD_ERROR_CODES, HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE } from '@/utils/transaction-errors'
import { useSafeShieldAssessmentUrl } from '@/features/hypernative'
import TxCheckError from '..'

jest.mock('@/features/hypernative', () => ({
  ...jest.requireActual('@/features/hypernative'),
  useSafeShieldAssessmentUrl: jest.fn(),
}))

const mockAssessmentUrl = useSafeShieldAssessmentUrl as jest.MockedFunction<typeof useSafeShieldAssessmentUrl>

const DEEP_LINK = 'https://app.hypernative.xyz/guardian/alert?chain=evm%3A1&safe=0x123&tx=0xabc&referrer=safe'

const hypernativeRevert = () =>
  new Error(
    `execution reverted (unknown custom error) (action="estimateGas", data="${GUARD_ERROR_CODES.UNAPPROVED_HASH}")`,
  )

describe('TxCheckError', () => {
  it('warns the transaction will fail for a genuine on-chain revert', () => {
    const revert = Object.assign(new Error('execution reverted'), { reason: 'GS013' })
    const { getByText, queryByText } = render(<TxCheckError error={revert} />)

    expect(getByText(/most likely fail/)).toBeInTheDocument()
    expect(queryByText(/Could not check/)).not.toBeInTheDocument()
  })

  it('shows the Hypernative approval message when the HN guard blocks execution', () => {
    mockAssessmentUrl.mockReturnValue(DEEP_LINK)

    const { getByText, queryByText, queryByTestId } = render(
      <TxCheckError error={hypernativeRevert()} context="estimation" />,
    )

    expect(getByText(HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(queryByText(/most likely fail/)).not.toBeInTheDocument()
    expect(queryByText(/Guard reverted the transaction/)).not.toBeInTheDocument()
    expect(queryByText(/GS013/)).not.toBeInTheDocument()
    expect(queryByText('Details')).not.toBeInTheDocument()
    expect(queryByTestId('error-details')).not.toBeInTheDocument()
  })

  it('deep-links the CTA to this transaction', () => {
    mockAssessmentUrl.mockReturnValue(DEEP_LINK)

    const { getByRole } = render(<TxCheckError error={hypernativeRevert()} context="estimation" />)

    expect(getByRole('link', { name: /Approve in Hypernative/ })).toHaveAttribute('href', DEEP_LINK)
  })

  it('shows the sentence without a CTA when the deep link cannot be built', () => {
    mockAssessmentUrl.mockReturnValue(null)

    const { getByText, queryByRole } = render(<TxCheckError error={hypernativeRevert()} context="estimation" />)

    expect(getByText(HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps the generic guard wording for a non-Hypernative guard revert', () => {
    const otherGuardRevert = Object.assign(new Error('execution reverted'), { reason: 'GS013' })
    const { getByText, queryByText } = render(<TxCheckError error={otherGuardRevert} context="estimation" />)

    expect(getByText(/most likely fail/)).toBeInTheDocument()
    expect(queryByText(HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE)).not.toBeInTheDocument()
  })

  it('says it could not check for an infrastructure failure', () => {
    const infra = new Error('HTTP request failed. Status: 500')
    const { getByText, queryByText } = render(<TxCheckError error={infra} />)

    expect(getByText(/Could not check this transaction/)).toBeInTheDocument()
    expect(getByText(/Nothing was signed/)).toBeInTheDocument()
    // Must NOT claim the transaction will fail when we simply could not reach the node.
    expect(queryByText(/most likely fail/)).not.toBeInTheDocument()
  })
})
