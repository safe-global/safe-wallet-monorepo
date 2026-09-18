import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { AllSafeItems, SafeItem } from '@/hooks/safes'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'
import * as gatewayApi from '@/store/api/gateway'
import NameAccountsFields from '../NameAccountsFields'

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/common/Identicon', () => ({ __esModule: true, default: () => <div data-testid="identicon" /> }))
// Stubbed rather than partially mocked: requiring the real barrel here trips its import cycle.
jest.mock('@/features/multichain', () => ({
  NetworkLogosPill: () => <div data-testid="networks" />,
  getSafeSetups: () => [],
  getSharedSetup: () => undefined,
}))

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
    </FormProvider>
  )
}

describe('NameAccountsFields', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false)
    jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockReturnValue({ data: [] } as never)
  })

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

  it('shows the threshold, networks and balance columns on desktop', () => {
    render(<Harness items={[safeItem(ADDRESS_A)]} />)

    expect(screen.getByRole('columnheader', { name: 'Threshold' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Networks' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Balance' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show details' })).not.toBeInTheDocument()
  })

  it('folds the stat columns into a chevron-revealed detail row on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<Harness items={[safeItem(ADDRESS_A)]} />)

    expect(screen.queryByRole('columnheader', { name: 'Threshold' })).not.toBeInTheDocument()
    expect(screen.getByTestId('account-name-input')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }))

    expect(screen.getByText('Threshold')).toBeInTheDocument()
    expect(screen.getByText('Networks')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('explains that names are shared with the workspace', () => {
    render(<Harness items={[safeItem(ADDRESS_A)]} />)

    expect(screen.getByText(/Your whole workspace sees these names/)).toBeInTheDocument()
  })
})
