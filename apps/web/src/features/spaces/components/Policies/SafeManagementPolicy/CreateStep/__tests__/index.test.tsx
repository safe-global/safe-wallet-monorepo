import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import {
  GUARD_LOCK_CONFIRM_LABEL,
  GUARD_LOCK_TITLE,
  GUARD_POLICY_NEXT_LABEL,
  NO_FUNCTION_SELECTED_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import * as stepHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyStep'
import { guardPolicyStep, SAFE_ID } from '../../../GuardPolicyFlow/guardPolicyStep.fixtures'
import { GUARD_CRITICAL_FUNCTION_IDS, SAFE_MANAGEMENT_FUNCTIONS, SAFE_MANAGEMENT_FUNCTION_IDS } from '../../contracts'
import CreateSafeManagementPolicy from '../index'

const mockStep = (data?: Partial<{ safe: string; functionIds: string[]; guardLockConfirmed: boolean }>) =>
  jest
    .spyOn(stepHook, 'useGuardPolicyStep')
    .mockReturnValue(
      guardPolicyStep({ safe: SAFE_ID, functionIds: SAFE_MANAGEMENT_FUNCTION_IDS, guardLockConfirmed: false, ...data }),
    )

const nextButton = () => screen.getByRole('button', { name: GUARD_POLICY_NEXT_LABEL })

describe('CreateSafeManagementPolicy', () => {
  afterEach(() => jest.restoreAllMocks())

  it('offers every management function, all allowed to begin with', () => {
    mockStep()
    renderWithUserEvent(<CreateSafeManagementPolicy />)

    for (const fn of SAFE_MANAGEMENT_FUNCTIONS) {
      expect(screen.getByTestId(`safe-management-${fn.id}`)).toBeChecked()
    }
  })

  it('enables Next while every function stays allowed', async () => {
    mockStep()
    renderWithUserEvent(<CreateSafeManagementPolicy />)

    await waitFor(() => expect(nextButton()).toBeEnabled())
  })

  it('blocks Next and says so when nothing is left allowed', () => {
    mockStep({ functionIds: [] })
    renderWithUserEvent(<CreateSafeManagementPolicy />)

    expect(screen.getByText(NO_FUNCTION_SELECTED_ERROR)).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
  })

  // Dropping a guard change can strand the policy guard, so the warning asks for consent first.
  it('demands consent before leaving a guard change out', async () => {
    const allowed = SAFE_MANAGEMENT_FUNCTION_IDS.filter((id) => !GUARD_CRITICAL_FUNCTION_IDS.includes(id))
    mockStep({ functionIds: allowed })
    const { user } = renderWithUserEvent(<CreateSafeManagementPolicy />)

    expect(screen.getByText(GUARD_LOCK_TITLE)).toBeInTheDocument()
    await waitFor(() => expect(nextButton()).toBeDisabled())

    await user.click(screen.getByLabelText(GUARD_LOCK_CONFIRM_LABEL))

    await waitFor(() => expect(nextButton()).toBeEnabled())
  })

  it('does not ask for consent while the guard changes stay allowed', () => {
    mockStep()
    renderWithUserEvent(<CreateSafeManagementPolicy />)

    expect(screen.queryByText(GUARD_LOCK_TITLE)).not.toBeInTheDocument()
  })
})
