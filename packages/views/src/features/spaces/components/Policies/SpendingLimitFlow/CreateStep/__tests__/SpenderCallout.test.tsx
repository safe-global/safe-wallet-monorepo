import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { CALLOUT_DESCRIPTION, CALLOUT_DISMISS_LABEL, CALLOUT_TITLE } from '../../constants'
import SpenderCallout from '../SpenderCallout'

describe('SpenderCallout', () => {
  it('explains who a spender can be and that spending needs no approvals', () => {
    renderWithUserEvent(<SpenderCallout dismissed={false} onDismiss={jest.fn()} />)

    expect(screen.getByText(CALLOUT_TITLE)).toBeInTheDocument()
    expect(screen.getByText(CALLOUT_DESCRIPTION)).toBeInTheDocument()
  })

  it('reports the dismissal to its owner rather than hiding itself', async () => {
    const onDismiss = jest.fn()
    const { user } = renderWithUserEvent(<SpenderCallout dismissed={false} onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button', { name: CALLOUT_DISMISS_LABEL }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it('renders nothing once dismissed', () => {
    renderWithUserEvent(<SpenderCallout dismissed onDismiss={jest.fn()} />)

    expect(screen.queryByText(CALLOUT_TITLE)).not.toBeInTheDocument()
  })
})
