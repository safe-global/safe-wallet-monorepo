import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { renderWithUserEvent, render, screen } from '@/tests/test-utils'
import LimitedActionsHint from '../LimitedActionsHint'

describe('LimitedActionsHint', () => {
  it('should render the hint copy', () => {
    render(<LimitedActionsHint />)

    expect(screen.getByTestId('policies-limited-actions-hint')).toHaveTextContent('Some actions limited')
  })

  it('should, on hover, explain the limits and link to the policies article', async () => {
    const { user } = renderWithUserEvent(<LimitedActionsHint />)

    await user.hover(screen.getByTestId('policies-limited-actions-hint'))

    expect(
      await screen.findByRole('heading', { name: 'Nested Safe proposals must be created in Safe{Wallet}.' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Spending limits covered on 10 networks today')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', HelpCenterArticle.POLICIES)
  })
})
