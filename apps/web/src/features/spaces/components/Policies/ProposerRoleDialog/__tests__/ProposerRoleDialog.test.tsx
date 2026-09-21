import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import ProposerRoleDialog, { type ProposerRoleDialogProps } from '../index'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const CHAIN_ID = '1'
const SAFE = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const PROPOSER = '0x8675B754342754A30A2AeF474D114d8460bca19b'

const treasury: SafeAccountOption = {
  id: buildSafeAccountId(CHAIN_ID, SAFE),
  chainId: CHAIN_ID,
  address: SAFE,
  name: 'Treasury',
  eligibility: 'signer',
  threshold: 3,
  owners: 5,
  chain: { chainId: CHAIN_ID, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  fiatTotal: '123720',
}

const renderDialog = (props: Partial<ProposerRoleDialogProps> = {}) =>
  renderWithUserEvent(
    <ProposerRoleDialog
      open
      onOpenChange={jest.fn()}
      onSubmit={jest.fn()}
      accounts={[treasury]}
      onSafeAccountChange={jest.fn()}
      {...props}
    />,
  )

const submitButton = () => screen.getByRole('button', { name: 'Submit' })

// The proposer field is a combobox too, so the account field is addressed by its test id.
const accountField = () => screen.getByTestId('safe-account-selector')

const openAccountField = async (user: ReturnType<typeof renderDialog>['user']) => {
  const trigger = accountField()
  await user.click(trigger)
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
}

describe('ProposerRoleDialog', () => {
  it('names the policy and what it does', () => {
    render(
      <ProposerRoleDialog
        open
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
        accounts={[treasury]}
        onSafeAccountChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: /Proposer role/ })).toBeInTheDocument()
    expect(screen.getByText('Let teammates without signing rights propose transactions.')).toBeInTheDocument()
  })

  it('warns that the grant needs a wallet signature to complete', () => {
    renderDialog()

    expect(screen.getByText('You are about to grant the ability to propose transactions.')).toBeInTheDocument()
    expect(
      screen.getByText('To complete the setup, confirm with a signature from your connected wallet.'),
    ).toBeInTheDocument()
  })

  it('says the proposer address is public and the name is not', () => {
    renderDialog()

    expect(
      screen.getByText('The beneficiary that will have the ability to propose transactions, publicly visible'),
    ).toBeInTheDocument()
    expect(screen.getByText('Only you can see this name. Everyone else sees the address.')).toBeInTheDocument()
  })

  it('renders nothing while closed', () => {
    render(
      <ProposerRoleDialog
        open={false}
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
        accounts={[treasury]}
        onSafeAccountChange={jest.fn()}
      />,
    )

    expect(screen.queryByRole('heading', { name: /Proposer role/ })).not.toBeInTheDocument()
  })

  describe('submit gating', () => {
    it('disables submit until a Safe account is picked', () => {
      renderDialog({ defaultValues: { proposer: PROPOSER, name: 'Nicole' } })

      expect(submitButton()).toBeDisabled()
    })

    it('disables submit while the proposer address is empty', () => {
      renderDialog({ safeAccount: treasury.id })

      expect(submitButton()).toBeDisabled()
    })

    it('enables submit once an account and a valid proposer are set', async () => {
      renderDialog({ safeAccount: treasury.id, defaultValues: { proposer: PROPOSER } })

      await waitFor(() => expect(submitButton()).toBeEnabled())
    })

    it('reports the entered values to onSubmit', async () => {
      const onSubmit = jest.fn()
      const { user } = renderDialog({
        safeAccount: treasury.id,
        defaultValues: { proposer: PROPOSER, name: 'Nicole' },
        onSubmit,
      })

      await waitFor(() => expect(submitButton()).toBeEnabled())
      await user.click(submitButton())

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ proposer: PROPOSER, name: 'Nicole' }),
          expect.anything(),
        ),
      )
    })

    it('swaps submit for a disabled spinner while submitting', () => {
      renderDialog({
        safeAccount: treasury.id,
        defaultValues: { proposer: PROPOSER },
        isSubmitting: true,
      })

      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled()
    })

    it('submits without a name, which is optional', async () => {
      const onSubmit = jest.fn()
      const { user } = renderDialog({
        safeAccount: treasury.id,
        defaultValues: { proposer: PROPOSER },
        onSubmit,
      })

      await waitFor(() => expect(submitButton()).toBeEnabled())
      await user.click(submitButton())

      await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    })
  })

  describe('Safe account field', () => {
    it('shows the picked account on the trigger', () => {
      renderDialog({ safeAccount: treasury.id })

      expect(accountField()).toHaveTextContent('Treasury')
    })

    it('states the eligibility rule below the field', () => {
      renderDialog()

      expect(screen.getByText("You only see accounts where you're a signer or proposer.")).toBeInTheDocument()
    })

    it('reports a picked account to onSafeAccountChange', async () => {
      const onSafeAccountChange = jest.fn()
      const { user } = renderDialog({ onSafeAccountChange })

      await openAccountField(user)
      await user.click(await screen.findByRole('option'))

      expect(onSafeAccountChange).toHaveBeenCalledWith(treasury.id)
    })

    it('passes the loading state through to the account field', () => {
      renderDialog({ accounts: [], accountsLoading: true })

      expect(accountField().querySelector('[data-testid="safe-account-avatar-skeleton"]')).toBeInTheDocument()
    })

    it('offers a retry when the accounts failed to load', async () => {
      const onAccountsRetry = jest.fn()
      const { user } = renderDialog({ accounts: [], accountsError: true, onAccountsRetry })

      await openAccountField(user)
      await user.click(await screen.findByRole('button', { name: /retry/i }))

      expect(onAccountsRetry).toHaveBeenCalled()
    })
  })

  it('surfaces a submission error without clearing the form', () => {
    renderDialog({
      safeAccount: treasury.id,
      defaultValues: { proposer: PROPOSER, name: 'Nicole' },
      errorMessage: <span>Error adding proposer</span>,
    })

    expect(screen.getByText('Error adding proposer')).toBeInTheDocument()
    expect(accountField()).toHaveTextContent('Treasury')
  })
})
