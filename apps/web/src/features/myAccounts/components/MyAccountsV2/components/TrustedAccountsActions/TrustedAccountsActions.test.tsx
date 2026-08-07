import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import TrustedAccountsActions from './index'

describe('TrustedAccountsActions', () => {
  it('renders the Add accounts and Manage actions', () => {
    render(<TrustedAccountsActions onManage={jest.fn()} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    expect(screen.getByTestId('open-add-accounts-chooser-button')).toHaveTextContent('Add accounts')
    expect(screen.getByTestId('add-more-safes-button')).toHaveTextContent('Manage list')
  })

  it('calls onManage when the manage button is clicked', async () => {
    const onManage = jest.fn()
    render(<TrustedAccountsActions onManage={onManage} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    await userEvent.click(screen.getByTestId('add-more-safes-button'))
    expect(onManage).toHaveBeenCalledTimes(1)
  })

  it('opens the "Add Safe accounts" chooser with both options', async () => {
    render(<TrustedAccountsActions onManage={jest.fn()} />, {
      routerProps: { pathname: '/welcome/accounts', query: {} },
    })

    await userEvent.click(screen.getByTestId('open-add-accounts-chooser-button'))

    expect(screen.getByRole('heading', { name: 'Add Safe accounts' })).toBeInTheDocument()
    expect(screen.getByTestId('add-accounts-select-existing')).toHaveTextContent('Select existing')
    expect(screen.getByTestId('add-accounts-create-new')).toHaveTextContent('Create new')
  })
})
