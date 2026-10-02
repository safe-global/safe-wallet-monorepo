import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import AddPolicyDialog from '../index'
import { ADD_POLICY_OPTIONS, RECOVERY_POLICY_OPTION, type AddPolicyOption } from '../options'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const renderDialog = (props: Partial<React.ComponentProps<typeof AddPolicyDialog>> = {}) =>
  renderWithUserEvent(<AddPolicyDialog open onOpenChange={jest.fn()} {...props} />)

describe('AddPolicyDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists every policy a user can set up', () => {
    renderDialog()

    expect(screen.getByRole('heading', { name: 'Add policy' })).toBeInTheDocument()

    ADD_POLICY_OPTIONS.forEach(({ title, description }) => {
      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })

  it('reports which policy was picked', async () => {
    const onSelect = jest.fn()
    const { user } = renderDialog({ onSelect })

    await user.click(screen.getByTestId('add-policy-option-proposer'))

    expect(onSelect).toHaveBeenCalledWith('proposer')
  })

  it('lays out three or fewer policies in a single column', () => {
    renderDialog({ options: ADD_POLICY_OPTIONS })

    expect(screen.getByTestId('add-policy-options')).not.toHaveClass('sm:grid-cols-2')
  })

  it('splits more than three policies into two columns', () => {
    const options: AddPolicyOption[] = [...ADD_POLICY_OPTIONS, RECOVERY_POLICY_OPTION]

    renderDialog({ options })

    expect(screen.getByTestId('add-policy-options')).toHaveClass('sm:grid-cols-2')
  })

  it('ignores clicks on a disabled policy', async () => {
    const onSelect = jest.fn()
    const options = ADD_POLICY_OPTIONS.map((option) =>
      option.id === 'spending-limit' ? { ...option, disabled: true } : option,
    )
    const { user } = renderDialog({ options, onSelect })

    await user.click(screen.getByTestId('add-policy-option-spending-limit'))

    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByTestId('add-policy-option-spending-limit')).toHaveAttribute('aria-disabled', 'true')
  })

  it('explains why a policy is disabled', async () => {
    const options = ADD_POLICY_OPTIONS.map((option) =>
      option.id === 'spending-limit'
        ? { ...option, disabled: true, disabledTooltip: 'You need to be an Admin to add policies' }
        : option,
    )
    const { user } = renderDialog({ options })

    await user.hover(screen.getByTestId('add-policy-option-spending-limit'))

    expect(await screen.findByText('You need to be an Admin to add policies')).toBeInTheDocument()
  })

  it('renders nothing while closed', () => {
    renderWithUserEvent(<AddPolicyDialog open={false} onOpenChange={jest.fn()} />)

    expect(screen.queryByTestId('add-policy-dialog')).not.toBeInTheDocument()
  })

  it('tracks the picked policy', async () => {
    const { user } = renderDialog()

    await user.click(screen.getByTestId('add-policy-option-spending-limit'))

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.ADD_POLICY_DIALOG_CLOSED, label: 'spending-limit' },
      { [MixpanelEventParams.RESULT]: 'selected', [MixpanelEventParams.POLICY_TYPE]: 'spending-limit' },
    )
  })

  it('tracks a dismissal and still closes the dialog', async () => {
    const onOpenChange = jest.fn()
    const { user } = renderDialog({ onOpenChange })

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(trackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.ADD_POLICY_DIALOG_CLOSED, label: 'dismissed' },
      { [MixpanelEventParams.RESULT]: 'dismissed' },
    )
  })

  it('does not track a click on a disabled policy', async () => {
    const options = ADD_POLICY_OPTIONS.map((option) =>
      option.id === 'proposer' ? { ...option, disabled: true } : option,
    )
    const { user } = renderDialog({ options })

    await user.click(screen.getByTestId('add-policy-option-proposer'))

    expect(trackEvent).not.toHaveBeenCalled()
  })
})
