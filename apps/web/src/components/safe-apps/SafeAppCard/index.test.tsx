import userEvent from '@testing-library/user-event'

import { render, screen } from '@/tests/test-utils'
import { SafeAppCardContainer } from '.'

describe('SafeAppCardContainer', () => {
  it('keeps card actions outside the app navigation link', async () => {
    const user = userEvent.setup()
    const onCardClick = jest.fn()
    const onActionClick = jest.fn()

    const { container } = render(
      <SafeAppCardContainer safeAppUrl="/apps/open" onClickSafeApp={onCardClick}>
        <button type="button" onClick={onActionClick}>
          Pin app
        </button>
      </SafeAppCardContainer>,
    )

    await user.click(screen.getByRole('button', { name: 'Pin app' }))

    expect(onActionClick).toHaveBeenCalledTimes(1)
    expect(onCardClick).not.toHaveBeenCalled()
    expect(container.querySelector('a button')).not.toBeInTheDocument()
  })
})
