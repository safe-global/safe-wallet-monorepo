import type { ReactNode } from 'react'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import * as useIsWrongChainHook from '@/hooks/useIsWrongChain'
import * as useChainsHook from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import ProposerRoleForm, { type ProposerRoleFormProps } from '../ProposerRoleForm'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

// No wallet or scoped Safe here; the wallet gate is CheckWallet's own concern.
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactNode }) => <>{children(true)}</>,
}))

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

const eligible = { accounts: [treasury], isLoading: false, isError: false, hasWallet: true, refetch: jest.fn() }

const renderForm = (props: Partial<ProposerRoleFormProps> = {}) =>
  renderWithUserEvent(
    <ProposerRoleForm onSubmit={jest.fn()} safeAccounts={eligible} onSafeAccountChange={jest.fn()} {...props} />,
  )

const submitButton = () => screen.getByRole('button', { name: 'Submit' })

// The proposer field is a combobox too, so the account field is addressed by its test id.
const accountField = () => screen.getByTestId('safe-account-selector')

const openAccountField = async (user: ReturnType<typeof renderForm>['user']) => {
  const trigger = accountField()
  await user.click(trigger)
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
}

describe('ProposerRoleForm', () => {
  it('warns that the grant needs a wallet signature to complete', () => {
    renderForm()

    expect(screen.getByText('You are about to grant the ability to propose transactions.')).toBeInTheDocument()
    expect(
      screen.getByText('To complete the setup, confirm with a signature from your connected wallet.'),
    ).toBeInTheDocument()
  })

  it('says the proposer address is public and the name is not', () => {
    renderForm()

    expect(
      screen.getByText('The beneficiary that will have the ability to propose transactions, publicly visible'),
    ).toBeInTheDocument()
    expect(screen.getByText('Only you can see this name. Everyone else sees the address.')).toBeInTheDocument()
  })

  describe('submit gating', () => {
    it('disables submit until a Safe account is picked', () => {
      renderForm({ defaultValues: { proposer: PROPOSER, name: 'Nicole' } })

      expect(submitButton()).toBeDisabled()
    })

    it('disables submit while the proposer address is empty', () => {
      renderForm({ safeAccount: treasury.id })

      expect(submitButton()).toBeDisabled()
    })

    it('enables submit once an account and a valid proposer are set', async () => {
      renderForm({ safeAccount: treasury.id, defaultValues: { proposer: PROPOSER } })

      await waitFor(() => expect(submitButton()).toBeEnabled())
    })

    it('keeps submit disabled while the picked Safe account is not activated', async () => {
      const notActivated: SafeAccountOption = {
        ...treasury,
        id: buildSafeAccountId('137', SAFE),
        chainId: '137',
        ineligibleReason: 'not-activated',
      }
      renderForm({
        safeAccounts: { ...eligible, accounts: [treasury, notActivated] },
        safeAccount: notActivated.id,
        defaultValues: { proposer: PROPOSER },
      })

      await screen.findByText('You need to activate this Safe before transacting')
      expect(submitButton()).toBeDisabled()
    })

    it('keeps submit disabled while the picked Safe account is missing from the resolved accounts', async () => {
      renderForm({ safeAccount: buildSafeAccountId('137', SAFE), defaultValues: { proposer: PROPOSER } })

      await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proposer' })).toHaveValue(PROPOSER))
      expect(submitButton()).toBeDisabled()
    })

    it('runs the proposer rule on the typed address and blocks submit on its message', async () => {
      const validateProposer = jest.fn().mockResolvedValue('Cannot add a signer of this Safe account as proposer')
      const { user } = renderForm({ safeAccount: treasury.id, validateProposer })

      await user.type(screen.getByRole('combobox', { name: 'Proposer' }), PROPOSER)

      await waitFor(() => expect(validateProposer).toHaveBeenCalledWith(PROPOSER))
      await waitFor(() =>
        expect(screen.getByText('Cannot add a signer of this Safe account as proposer')).toBeInTheDocument(),
      )
      expect(submitButton()).toBeDisabled()
    })

    it('re-validates the proposer when the Safe account changes', async () => {
      const validateProposer = jest.fn().mockResolvedValue(undefined)
      const { user, rerender } = renderForm({ safeAccount: treasury.id, validateProposer })

      await user.type(screen.getByRole('combobox', { name: 'Proposer' }), PROPOSER)
      await waitFor(() => expect(validateProposer).toHaveBeenCalled())
      validateProposer.mockClear()

      rerender(
        <ProposerRoleForm
          onSubmit={jest.fn()}
          safeAccounts={eligible}
          onSafeAccountChange={jest.fn()}
          safeAccount="137:0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          validateProposer={validateProposer}
        />,
      )

      await waitFor(() => expect(validateProposer).toHaveBeenCalledWith(PROPOSER))
    })

    it('re-validates the proposer when the rule itself changes, e.g. once the Safe has loaded', async () => {
      const loading = jest.fn().mockResolvedValue('Loading the Safe account details, please wait')
      const loaded = jest.fn().mockResolvedValue(undefined)
      const { user, rerender } = renderForm({ safeAccount: treasury.id, validateProposer: loading })

      await user.type(screen.getByRole('combobox', { name: 'Proposer' }), PROPOSER)
      await waitFor(() => expect(screen.getByText('Loading the Safe account details, please wait')).toBeInTheDocument())
      expect(submitButton()).toBeDisabled()

      rerender(
        <ProposerRoleForm
          onSubmit={jest.fn()}
          safeAccounts={eligible}
          onSafeAccountChange={jest.fn()}
          safeAccount={treasury.id}
          validateProposer={loaded}
        />,
      )

      await waitFor(() => expect(loaded).toHaveBeenCalledWith(PROPOSER))
      await waitFor(() => expect(submitButton()).toBeEnabled())
      expect(screen.queryByText('Loading the Safe account details, please wait')).not.toBeInTheDocument()
    })

    it('re-validates a prefilled proposer when the Safe account changes', async () => {
      const validateProposer = jest.fn().mockResolvedValue(undefined)
      const { rerender } = renderForm({
        safeAccount: treasury.id,
        defaultValues: { proposer: PROPOSER },
        validateProposer,
      })

      await waitFor(() => expect(validateProposer).toHaveBeenCalledWith(PROPOSER))
      validateProposer.mockClear()

      rerender(
        <ProposerRoleForm
          onSubmit={jest.fn()}
          safeAccounts={eligible}
          onSafeAccountChange={jest.fn()}
          safeAccount="137:0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          defaultValues={{ proposer: PROPOSER }}
          validateProposer={validateProposer}
        />,
      )

      await waitFor(() => expect(validateProposer).toHaveBeenCalledWith(PROPOSER))
    })

    it('reports the entered values to onSubmit', async () => {
      const onSubmit = jest.fn()
      const { user } = renderForm({
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
      renderForm({
        safeAccount: treasury.id,
        defaultValues: { proposer: PROPOSER },
        isSubmitting: true,
      })

      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled()
    })

    it('submits without a name, which is optional', async () => {
      const onSubmit = jest.fn()
      const { user } = renderForm({
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
      renderForm({ safeAccount: treasury.id })

      expect(accountField()).toHaveTextContent('Treasury')
    })

    it('states the eligibility rule below the field', () => {
      renderForm()

      expect(screen.getByText("You only see accounts where you're a signer or proposer.")).toBeInTheDocument()
    })

    it('reports a picked account to onSafeAccountChange', async () => {
      const onSafeAccountChange = jest.fn()
      const { user } = renderForm({ onSafeAccountChange })

      await openAccountField(user)
      await user.click(await screen.findByRole('option'))

      expect(onSafeAccountChange).toHaveBeenCalledWith(treasury.id)
    })

    it('passes the loading state through to the account field', () => {
      renderForm({ safeAccounts: { ...eligible, accounts: [], isLoading: true } })

      expect(accountField().querySelector('[data-testid="safe-account-avatar-skeleton"]')).toBeInTheDocument()
    })

    it('offers a retry when the accounts failed to load', async () => {
      const refetch = jest.fn()
      const { user } = renderForm({ safeAccounts: { ...eligible, accounts: [], isError: true, refetch } })

      await openAccountField(user)
      await user.click(await screen.findByRole('button', { name: /retry/i }))

      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('wallet network', () => {
    beforeEach(() => {
      jest
        .spyOn(useChainsHook, 'useCurrentChain')
        .mockReturnValue(chainBuilder().with({ chainId: CHAIN_ID, chainName: 'Ethereum' }).build())
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('asks to change the wallet network when the wallet is on another chain than the picked Safe', () => {
      jest.spyOn(useIsWrongChainHook, 'default').mockReturnValue(true)

      renderForm({ safeAccount: treasury.id })

      expect(screen.getByText('Change your wallet network')).toBeInTheDocument()
      expect(screen.getByText(/You are trying to sign on Ethereum/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Switch to/ })).toBeInTheDocument()
    })

    it('shows no network warning when the wallet is on the picked Safe chain', () => {
      jest.spyOn(useIsWrongChainHook, 'default').mockReturnValue(false)

      renderForm({ safeAccount: treasury.id })

      expect(screen.queryByText('Change your wallet network')).not.toBeInTheDocument()
    })
  })

  it('surfaces a submission error without clearing the form', () => {
    renderForm({
      safeAccount: treasury.id,
      defaultValues: { proposer: PROPOSER, name: 'Nicole' },
      errorMessage: <span>Error adding proposer</span>,
    })

    expect(screen.getByText('Error adding proposer')).toBeInTheDocument()
    expect(accountField()).toHaveTextContent('Treasury')
  })
})
