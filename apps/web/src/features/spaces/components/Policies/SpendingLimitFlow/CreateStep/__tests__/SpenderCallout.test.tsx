import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { CALLOUT_DESCRIPTION, CALLOUT_DISMISS_LABEL, CALLOUT_TITLE } from '../../constants'
import SpenderCallout from '../SpenderCallout'

describe('SpenderCallout', () => {
  it('explains who a spender can be and that spending needs no approvals', () => {
    renderWithUserEvent(<SpenderCallout />)

    expect(screen.getByText(CALLOUT_TITLE)).toBeInTheDocument()
    expect(screen.getByText(CALLOUT_DESCRIPTION)).toBeInTheDocument()
  })

  it('disappears when dismissed', async () => {
    const { user } = renderWithUserEvent(<SpenderCallout />)

    await user.click(screen.getByRole('button', { name: CALLOUT_DISMISS_LABEL }))

    expect(screen.queryByText(CALLOUT_TITLE)).not.toBeInTheDocument()
  })
})
