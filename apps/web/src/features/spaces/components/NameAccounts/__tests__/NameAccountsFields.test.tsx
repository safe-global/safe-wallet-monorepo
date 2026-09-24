import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { AllSafeItems, SafeItem } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'
import NameAccountsFields from '../NameAccountsFields'
import { touchNames } from '../utils'

// The table has its own suite; here it only has to hand each row to the name cell.
jest.mock('@/features/myAccounts', () => ({
  __esModule: true,
  SafeAccountsTable: ({
    items,
    renderName,
  }: {
    items: Array<{ address: string }>
    renderName: (line: AccountLine) => React.ReactNode
  }) => (
    <div data-testid="safe-accounts-table">
      {items.map((item) => (
        <div key={item.address}>{renderName({ address: item.address } as AccountLine)}</div>
      ))}
    </div>
  ),
}))
jest.mock('@/components/common/Identicon', () => ({ __esModule: true, default: () => <div data-testid="identicon" /> }))

const ADDRESS_A = '0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaA'
const ADDRESS_B = '0xBbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbB'

const safeItem = (address: string, name?: string): SafeItem => ({
  chainId: '1',
  address,
  name,
  isPinned: true,
  isReadOnly: false,
  lastVisited: 0,
})

const Harness = ({ items, names = {} }: { items: AllSafeItems; names?: Record<string, string> }) => {
  const methods = useForm<AddAccountsFormValues>({ mode: 'onChange', defaultValues: { selectedSafes: {}, names } })
  return (
    <FormProvider {...methods}>
      <NameAccountsFields items={items} />
      <button type="button" onClick={() => touchNames(methods.getValues, methods.setValue, items)}>
        submit
      </button>
    </FormProvider>
  )
}

describe('NameAccountsFields', () => {
  it('shows a prefilled name as text and an unnamed Safe as an input', () => {
    render(<Harness items={[safeItem(ADDRESS_A, 'Treasury'), safeItem(ADDRESS_B)]} />)

    expect(screen.getByTestId('account-name-text')).toHaveTextContent('Treasury')
    const input = screen.getByTestId('account-name-input')
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('placeholder', 'Add a name')
  })

  it('keeps a name the user already typed instead of re-prefilling it', () => {
    render(<Harness items={[safeItem(ADDRESS_A, 'Treasury')]} names={{ [ADDRESS_A.toLowerCase()]: 'Typed' }} />)

    expect(screen.getByTestId('account-name-text')).toHaveTextContent('Typed')
  })

  it('turns a named row into an input on click and back into text once left', async () => {
    render(<Harness items={[safeItem(ADDRESS_A, 'Treasury')]} />)

    fireEvent.click(screen.getByTestId('account-name-text'))

    const input = screen.getByTestId('account-name-input')
    expect(input).toHaveValue('Treasury')

    fireEvent.change(input, { target: { value: 'Ops' } })
    fireEvent.blur(input)

    expect(await screen.findByTestId('account-name-text')).toHaveTextContent('Ops')
  })

  it('replaces the address with "Name is required" after an empty field is left, and hides it while focused', async () => {
    render(<Harness items={[safeItem(ADDRESS_A)]} />)
    const input = screen.getByTestId('account-name-input')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.focus(input)
    fireEvent.blur(input)

    expect(await screen.findByRole('alert')).toHaveTextContent('Name is required')
    expect(screen.queryByText(ADDRESS_A.slice(-6))).not.toBeInTheDocument()

    fireEvent.focus(input)

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByText(ADDRESS_A.slice(-6))).toBeInTheDocument()
  })

  it('turns every empty field red once a submit is attempted', async () => {
    render(<Harness items={[safeItem(ADDRESS_A), safeItem(ADDRESS_B)]} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))
    screen.getAllByRole('alert').forEach((alert) => expect(alert).toHaveTextContent('Name is required'))
  })

  it('opens the editor and shows the rule for a prefilled name the address book would reject', () => {
    render(<Harness items={[safeItem(ADDRESS_A, 'Op')]} />)

    expect(screen.getByTestId('account-name-input')).toHaveValue('Op')
    expect(screen.queryByTestId('account-name-text')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Names must be at least 3 character(s) long')
  })

  it('shows the shared name rules in place of the address', async () => {
    render(<Harness items={[safeItem(ADDRESS_A)]} />)
    const input = screen.getByTestId('account-name-input')

    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.blur(input)

    expect(await screen.findByRole('alert')).toHaveTextContent('Names must be at least 3 character(s) long')
  })

  it('explains that names are shared with the workspace', () => {
    render(<Harness items={[safeItem(ADDRESS_A)]} />)

    expect(screen.getByText(/Everyone on the Workspace can see these names/)).toBeInTheDocument()
  })
})
