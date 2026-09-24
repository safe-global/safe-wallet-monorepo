import { FormProvider, useForm } from 'react-hook-form'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { SAFE_ACCOUNT_SELECTOR_LABEL } from '../../../SafeAccountSelector/constants'
import { buildSafeAccountId } from '../../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../../SafeAccountSelector/types'
import { createDefaultFormValues, type SpendingLimitPolicyFormValues } from '../../types'
import SafeAccountField from '../SafeAccountField'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'

const treasury: SafeAccountOption = {
  id: buildSafeAccountId('1', SAFE_A),
  chainId: '1',
  address: SAFE_A,
  name: 'Treasury',
  threshold: 2,
  owners: 3,
  eligibility: 'signer',
  chain: { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
}

const notActivated: SafeAccountOption = {
  ...treasury,
  id: buildSafeAccountId('137', SAFE_A),
  chainId: '137',
  ineligibleReason: 'not-activated',
}

const Harness = ({
  onSafeChange,
  onRead,
  accounts = [treasury],
  safe = '',
}: {
  onSafeChange: (chainId: string, address: string) => void
  onRead: (values: SpendingLimitPolicyFormValues) => void
  accounts?: SafeAccountOption[]
  safe?: string
}) => {
  const methods = useForm<SpendingLimitPolicyFormValues>({
    defaultValues: { ...createDefaultFormValues(), safe },
    mode: 'onChange',
  })
  return (
    <FormProvider {...methods}>
      <span data-testid="safe-valid">{String(methods.formState.isValid)}</span>
      <SafeAccountField
        accounts={accounts}
        isLoading={false}
        isError={false}
        onRetry={jest.fn()}
        hasWallet
        onSafeChange={onSafeChange}
      />
      <button type="button" onClick={() => onRead(methods.getValues())}>
        read
      </button>
    </FormProvider>
  )
}

describe('SafeAccountField', () => {
  it('uses the shared selector with its default label and helper', () => {
    renderWithUserEvent(<Harness onSafeChange={jest.fn()} onRead={jest.fn()} />)

    expect(screen.getByLabelText(SAFE_ACCOUNT_SELECTOR_LABEL)).toBeInTheDocument()
  })

  it('stores the picked account in the form and moves the scope to its chain and address', async () => {
    const onSafeChange = jest.fn()
    const onRead = jest.fn()
    const { user } = renderWithUserEvent(<Harness onSafeChange={onSafeChange} onRead={onRead} />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await user.click(await screen.findByRole('option'))

    expect(onSafeChange).toHaveBeenCalledWith('1', SAFE_A)
    await user.click(screen.getByRole('button', { name: 'read' }))
    expect(onRead).toHaveBeenCalledWith(expect.objectContaining({ safe: `1:${SAFE_A}` }))
  })

  it('rejects a prefilled Safe that is not activated once the accounts resolve', async () => {
    renderWithUserEvent(
      <Harness
        onSafeChange={jest.fn()}
        onRead={jest.fn()}
        accounts={[treasury, notActivated]}
        safe={notActivated.id}
      />,
    )

    await waitFor(() => expect(screen.getByTestId('safe-valid')).toHaveTextContent('false'))
  })

  it('accepts a prefilled Safe that is activated', async () => {
    renderWithUserEvent(
      <Harness onSafeChange={jest.fn()} onRead={jest.fn()} accounts={[treasury, notActivated]} safe={treasury.id} />,
    )

    await waitFor(() => expect(screen.getByTestId('safe-valid')).toHaveTextContent('true'))
  })
})
