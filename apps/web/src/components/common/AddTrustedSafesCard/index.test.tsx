import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import AddTrustedSafesCard from '.'

describe('AddTrustedSafesCard', () => {
  it('renders the empty-state CTA', () => {
    render(<AddTrustedSafesCard onAdd={jest.fn()} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    expect(screen.getByText('What are my accounts?')).toBeInTheDocument()
    expect(screen.getByText(/protects you from impersonation/i)).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
    expect(screen.getByTestId('open-add-accounts-chooser-button')).toHaveTextContent('Add accounts')
    expect(screen.getByTestId('add-trusted-safes-button')).toHaveTextContent('Manage list')
  })

  it('calls onAdd when the manage-list button is clicked', async () => {
    const onAdd = jest.fn()
    render(<AddTrustedSafesCard onAdd={onAdd} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    await userEvent.click(screen.getByTestId('add-trusted-safes-button'))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('opens the "Add Safe accounts" chooser when "Add accounts" is clicked', async () => {
    render(<AddTrustedSafesCard onAdd={jest.fn()} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    expect(screen.queryByRole('heading', { name: 'Add Safe accounts' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('open-add-accounts-chooser-button'))

    expect(screen.getByRole('heading', { name: 'Add Safe accounts' })).toBeInTheDocument()
    expect(screen.getByTestId('add-accounts-select-existing')).toBeInTheDocument()
    expect(screen.getByTestId('add-accounts-create-new')).toBeInTheDocument()
  })
})
