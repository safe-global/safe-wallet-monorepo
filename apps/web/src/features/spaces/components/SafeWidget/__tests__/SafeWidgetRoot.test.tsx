import { render, screen } from '@/tests/test-utils'
import { SafeWidgetRoot } from '../SafeWidgetRoot'

describe('SafeWidgetRoot', () => {
  it('renders the title and children', () => {
    render(
      <SafeWidgetRoot title="Accounts">
        <span>Widget content</span>
      </SafeWidgetRoot>,
    )

    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('Widget content')).toBeInTheDocument()
  })

  it('renders the action when provided', () => {
    render(
      <SafeWidgetRoot title="Accounts" action={<button>Manage accounts</button>}>
        <span />
      </SafeWidgetRoot>,
    )

    expect(screen.getByRole('button', { name: 'Manage accounts' })).toBeInTheDocument()
  })

  it('keeps a constant title row height with and without an action, so titles align across widgets', () => {
    const { rerender } = render(
      <SafeWidgetRoot title="Pending">
        <span />
      </SafeWidgetRoot>,
    )

    expect(screen.getByText('Pending').parentElement).toHaveClass('min-h-10')

    rerender(
      <SafeWidgetRoot title="Accounts" action={<button>Manage accounts</button>}>
        <span />
      </SafeWidgetRoot>,
    )

    expect(screen.getByText('Accounts').parentElement).toHaveClass('min-h-10')
  })

  it('calls onTitleClick when the title is clicked', () => {
    const onTitleClick = jest.fn()
    render(
      <SafeWidgetRoot title="Accounts" onTitleClick={onTitleClick}>
        <span />
      </SafeWidgetRoot>,
    )

    screen.getByText('Accounts').parentElement?.click()

    expect(onTitleClick).toHaveBeenCalledTimes(1)
  })
})
