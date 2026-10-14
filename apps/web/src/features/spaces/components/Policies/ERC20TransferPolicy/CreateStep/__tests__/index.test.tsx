import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import {
  ADD_RECIPIENT_LABEL,
  ADD_TOKEN_LABEL,
  GUARD_POLICY_NEXT_LABEL,
  RECIPIENTS_LABEL,
  REMOVE_RECIPIENT_LABEL,
  TOKENS_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import * as stepHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyStep'
import { guardPolicyStep, SAFE_ID } from '../../../GuardPolicyFlow/guardPolicyStep.fixtures'
import CreateTokenAllowlistPolicy from '../index'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const RECIPIENT = '0xdead00000000000000000000000000000000de01'

const mockStep = (data?: Partial<{ safe: string; tokens: { address: string }[]; recipients: { address: string }[] }>) =>
  jest.spyOn(stepHook, 'useGuardPolicyStep').mockReturnValue(
    guardPolicyStep({
      safe: SAFE_ID,
      tokens: [{ address: '' }],
      recipients: [{ address: '' }],
      ...data,
    }),
  )

const nextButton = () => screen.getByRole('button', { name: GUARD_POLICY_NEXT_LABEL })

describe('CreateTokenAllowlistPolicy', () => {
  afterEach(() => jest.restoreAllMocks())

  it('asks for the tokens and who may receive them', () => {
    mockStep()
    renderWithUserEvent(<CreateTokenAllowlistPolicy />)

    expect(screen.getByText(TOKENS_LABEL)).toBeInTheDocument()
    expect(screen.getByText(RECIPIENTS_LABEL)).toBeInTheDocument()
  })

  // The policy means nothing without both halves, so an empty row must not reach the review.
  it('blocks Next until both a token and a recipient are given', async () => {
    mockStep()
    renderWithUserEvent(<CreateTokenAllowlistPolicy />)

    await waitFor(() => expect(nextButton()).toBeDisabled())
  })

  it('blocks Next when a recipient is given but no token is', async () => {
    mockStep({ recipients: [{ address: RECIPIENT }] })
    renderWithUserEvent(<CreateTokenAllowlistPolicy />)

    await waitFor(() => expect(nextButton()).toBeDisabled())
  })

  it('enables Next once both are given', async () => {
    mockStep({ tokens: [{ address: USDC }], recipients: [{ address: RECIPIENT }] })
    renderWithUserEvent(<CreateTokenAllowlistPolicy />)

    await waitFor(() => expect(nextButton()).toBeEnabled())
  })

  it('adds and removes recipient rows', async () => {
    mockStep({ tokens: [{ address: USDC }], recipients: [{ address: RECIPIENT }] })
    const { user } = renderWithUserEvent(<CreateTokenAllowlistPolicy />)

    expect(screen.queryByRole('button', { name: REMOVE_RECIPIENT_LABEL })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: new RegExp(ADD_RECIPIENT_LABEL, 'i') }))

    await waitFor(() => expect(screen.getAllByRole('button', { name: REMOVE_RECIPIENT_LABEL })).toHaveLength(2))
  })

  it('offers another token row', async () => {
    mockStep({ tokens: [{ address: USDC }], recipients: [{ address: RECIPIENT }] })
    const { user } = renderWithUserEvent(<CreateTokenAllowlistPolicy />)

    await user.click(screen.getByRole('button', { name: new RegExp(ADD_TOKEN_LABEL, 'i') }))

    await waitFor(() => expect(screen.getAllByTestId(/^token-allowlist-token-/)).toHaveLength(2))
  })
})
