import userEvent from '@testing-library/user-event'

import { render, screen } from '@/tests/test-utils'
import AccountItemLink from '../AccountItemLink'

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

describe('AccountItemLink', () => {
  it('keeps row actions outside the Safe navigation link', async () => {
    const user = userEvent.setup()
    const onLinkClick = jest.fn()
    const onActionClick = jest.fn()

    const { container } = render(
      <AccountItemLink href="/home" onLinkClick={onLinkClick}>
        <button type="button" onClick={onActionClick}>
          Pin Safe
        </button>
      </AccountItemLink>,
    )

    await user.click(screen.getByRole('button', { name: 'Pin Safe' }))

    expect(onActionClick).toHaveBeenCalledTimes(1)
    expect(onLinkClick).not.toHaveBeenCalled()
    expect(container.querySelector('a button')).not.toBeInTheDocument()
  })
})
