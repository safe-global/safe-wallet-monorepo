import { render } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { GUARD_ERROR_CODES, HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE } from '@/utils/transaction-errors'
import { useSafeShieldAssessmentUrl } from '@/features/hypernative'
import { useCurrentChain } from '@/hooks/useChains'
import TxCheckError from '..'

jest.mock('@/features/hypernative', () => ({
  ...jest.requireActual('@/features/hypernative'),
  useSafeShieldAssessmentUrl: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
  default: jest.fn(),
}))

const mockAssessmentUrl = useSafeShieldAssessmentUrl as jest.MockedFunction<typeof useSafeShieldAssessmentUrl>
const mockCurrentChain = useCurrentChain as jest.MockedFunction<typeof useCurrentChain>

/** An ethers CALL_EXCEPTION: the code reaches us in `reason` and inside `message`. */
const gsRevert = (code: string) =>
  Object.assign(new Error(`execution reverted: "${code}" (action="call")`), { reason: code, code: 'CALL_EXCEPTION' })

const DEEP_LINK = 'https://app.hypernative.xyz/guardian/alert?chain=evm%3A1&safe=0x123&tx=0xabc&referrer=safe'

const hypernativeRevert = () =>
  new Error(
    `execution reverted (unknown custom error) (action="estimateGas", data="${GUARD_ERROR_CODES.UNAPPROVED_HASH}")`,
  )

describe('TxCheckError', () => {
  beforeEach(() => {
    mockCurrentChain.mockReturnValue(undefined)
  })

  it('warns the transaction will fail for a genuine on-chain revert', () => {
    const revert = Object.assign(new Error('execution reverted'), { reason: 'GS013' })
    const { getByText, queryByText } = render(<TxCheckError error={revert} />)

    expect(getByText(/most likely fail/)).toBeInTheDocument()
    expect(queryByText(/Could not check/)).not.toBeInTheDocument()
  })

  it('tells the user to raise a gas limit below the intrinsic minimum, not to reject (WA-3523)', () => {
    const error = new Error('intrinsic gas too low: gas 21000, minimum needed 25484')

    const { getByText, queryByText } = render(<TxCheckError error={error} context="estimation" />)

    expect(
      getByText('Gas limit too low. Minimum needed: 25,484. Increase the gas limit and try again.'),
    ).toBeInTheDocument()
    expect(queryByText(/most likely fail/)).not.toBeInTheDocument()
    expect(queryByText(/reject this transaction/)).not.toBeInTheDocument()
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

  it('names the cause for a GS code we have copy for, instead of predicting a failure', () => {
    const { getByText, queryByText } = render(<TxCheckError error={gsRevert('GS025')} context="estimation" />)

    expect(getByText('This transaction needs more confirmations before it can be executed.')).toBeInTheDocument()
    expect(queryByText(/most likely fail/)).not.toBeInTheDocument()
    // The raw code stays a support reference only.
    expect(getByText(/GS025/)).toBeInTheDocument()
  })

  it('interpolates the native asset into the cause', () => {
    const chain = chainBuilder().build()
    mockCurrentChain.mockReturnValue({ ...chain, nativeCurrency: { ...chain.nativeCurrency, symbol: 'ETH' } })

    const { getByText } = render(<TxCheckError error={gsRevert('GS011')} context="estimation" />)

    expect(getByText('Not enough ETH in this Safe Account to cover the network fee.')).toBeInTheDocument()
  })

  it('keeps the prediction rather than showing an unresolved placeholder', () => {
    // GS012 names the ERC-20 gas token, which this surface cannot resolve.
    const { getByText, queryByText } = render(<TxCheckError error={gsRevert('GS012')} context="estimation" />)

    expect(getByText(/most likely fail/)).toBeInTheDocument()
    expect(queryByText(/\{token\}/)).not.toBeInTheDocument()
  })

  it('keeps the prediction for a code whose only copy is the shared fallback', () => {
    const { getByText, queryByText } = render(<TxCheckError error={gsRevert('GS013')} context="estimation" />)

    expect(getByText(/most likely fail/)).toBeInTheDocument()
    expect(queryByText(/contact support with the reference below/)).not.toBeInTheDocument()
  })
})
