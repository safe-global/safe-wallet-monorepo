import { render, screen, waitFor } from '@/tests/test-utils'
import {
  GUARD_POLICY_NEXT_LABEL,
  MULTISEND_EXPLAINER_TEXT,
  MULTISEND_EXPLAINER_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import * as stepHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyStep'
import { guardPolicyStep, SAFE_ID } from '../../../GuardPolicyFlow/guardPolicyStep.fixtures'
import CreateMultiSendPolicy from '../index'

describe('CreateMultiSendPolicy', () => {
  afterEach(() => jest.restoreAllMocks())

  it('explains what the policy changes, since it has nothing to configure', () => {
    jest.spyOn(stepHook, 'useGuardPolicyStep').mockReturnValue(guardPolicyStep())
    render(<CreateMultiSendPolicy />)

    expect(screen.getByText(MULTISEND_EXPLAINER_TITLE)).toBeInTheDocument()
    expect(screen.getByText(MULTISEND_EXPLAINER_TEXT)).toBeInTheDocument()
  })

  it('blocks Next until a Safe is picked', () => {
    jest.spyOn(stepHook, 'useGuardPolicyStep').mockReturnValue(guardPolicyStep({ safe: '' }))
    render(<CreateMultiSendPolicy />)

    expect(screen.getByRole('button', { name: GUARD_POLICY_NEXT_LABEL })).toBeDisabled()
  })

  it('enables Next once the picked Safe is eligible', async () => {
    jest.spyOn(stepHook, 'useGuardPolicyStep').mockReturnValue(guardPolicyStep({ safe: SAFE_ID }))
    render(<CreateMultiSendPolicy />)

    await waitFor(() => expect(screen.getByRole('button', { name: GUARD_POLICY_NEXT_LABEL })).toBeEnabled())
  })
})
