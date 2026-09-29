import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import { ContactSource, useMergedAddressBooks, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { mockWallet } from '@/tests/mocks/hooks'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import { asActivePolicy, mockActiveSpendingLimit, mockMultiSpenderPolicy } from '../../mocks/policies'
import SpendingLimitDetails from '..'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('../../../../hooks/useSpaceSafes')
// Stubbed wholesale rather than with `requireActual`: this module sits in the spaces barrel import
// cycle, and pulling the real one in from a mock factory dies on its own TDZ.
jest.mock('@/hooks/useAllAddressBooks', () => ({
  __esModule: true,
  ContactSource: { space: 'space', local: 'local' },
  useMergedAddressBooks: jest.fn(),
}))

const mockUseSpaceSafes = useSpaceSafes as jest.MockedFunction<typeof useSpaceSafes>
const mockUseMergedAddressBooks = useMergedAddressBooks as jest.MockedFunction<typeof useMergedAddressBooks>

const contact = (address: string, name: string, source: ContactSource): ExtendedContact => ({
  address,
  name,
  source,
  chainIds: [policy.safe.chainId],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
})

/** The real hook merges the two books; the panel is asked which one it reads a spender from. */
const mockAddressBooks = ({
  space = {},
  local = {},
}: {
  space?: Record<string, string>
  local?: Record<string, string>
}) => {
  const lookup = (book: Record<string, string>, source: ContactSource) => (address: string) => {
    const entry = Object.entries(book).find(([key]) => sameAddress(key, address))
    return entry ? contact(entry[0], entry[1], source) : undefined
  }
  const getFromSpace = lookup(space, ContactSource.space)
  const getFromLocal = lookup(local, ContactSource.local)

  mockUseMergedAddressBooks.mockReturnValue({
    list: [],
    get: (address: string) => getFromSpace(address) ?? getFromLocal(address),
    getFromSpace,
    getFromLocal,
    has: (address: string) => Boolean(getFromSpace(address) ?? getFromLocal(address)),
  })
}

const policy = mockActiveSpendingLimit()

const mockSpaceSafes = (isReadOnly: boolean) => {
  const safe = safeItemBuilder()
    .with({ chainId: policy.safe.chainId, address: policy.safe.address, isReadOnly })
    .build()

  mockUseSpaceSafes.mockReturnValue({
    allSafes: [safe],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
    isUninitialized: false,
  })
}

const setup = () => render(<SpendingLimitDetails policy={policy} onClose={jest.fn()} />)

describe('SpendingLimitDetails', () => {
  beforeEach(() => {
    mockAddressBooks({})
  })

  it('shows a signer of the Safe the edit action, waiting on the edit flow', () => {
    mockWallet()
    mockSpaceSafes(false)

    setup()

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByText('Editing a spending limit is coming soon.')).toBeInTheDocument()
  })

  it('tells a wallet that does not sign for the Safe why it cannot edit', () => {
    mockWallet()
    mockSpaceSafes(true)

    setup()

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByText('Only signers of this Safe account can edit this spending limit.')).toBeInTheDocument()
  })

  it('asks for a wallet before offering anything to do', () => {
    mockWallet(null)
    mockSpaceSafes(false)

    setup()

    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument()
  })

  it('names a spender from the Space address book, and leaves an unknown one as its address', () => {
    mockWallet()
    mockSpaceSafes(false)
    const multiSpender = asActivePolicy(mockMultiSpenderPolicy())
    const [named, , unnamed] = multiSpender.data.spenders
    mockAddressBooks({ space: { [named.spender]: 'Payroll bot' } })

    render(<SpendingLimitDetails policy={multiSpender} onClose={jest.fn()} />)

    expect(screen.getByText('Payroll bot')).toBeInTheDocument()
    expect(screen.getByText(getSafeDisplayInfo('', unnamed.spender).shortAddress)).toBeInTheDocument()
  })

  it('ignores a spender name that exists only in the local address book', () => {
    mockWallet()
    mockSpaceSafes(false)
    const multiSpender = asActivePolicy(mockMultiSpenderPolicy())
    const [named] = multiSpender.data.spenders
    mockAddressBooks({ local: { [named.spender]: 'My own label' } })

    render(<SpendingLimitDetails policy={multiSpender} onClose={jest.fn()} />)

    expect(screen.queryByText('My own label')).not.toBeInTheDocument()
    expect(screen.getByText(getSafeDisplayInfo('', named.spender).shortAddress)).toBeInTheDocument()
  })

  it('renders the usage of the policy the row carries, without fetching it again', () => {
    mockWallet()
    mockSpaceSafes(false)

    setup()

    expect(screen.getAllByRole('progressbar')).toHaveLength(policy.data.spenders[0].allowances.length)
    expect(screen.queryByText('Last updated')).not.toBeInTheDocument()
  })

  it('hands the Edit button to the caller', async () => {
    mockWallet()
    mockSpaceSafes(false)
    const onEdit = jest.fn()

    const { user } = renderWithUserEvent(<SpendingLimitDetails policy={policy} onClose={jest.fn()} onEdit={onEdit} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})
