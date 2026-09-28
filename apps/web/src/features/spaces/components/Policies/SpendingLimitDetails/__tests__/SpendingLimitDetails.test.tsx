import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import { render, screen } from '@/tests/test-utils'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { mockWallet } from '@/tests/mocks/hooks'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import { asActivePolicy, mockActiveSpendingLimit, mockMultiSpenderPolicy } from '../../mocks/policies'
import SpendingLimitDetails from '..'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('../../../../hooks/useSpaceSafes')

const mockUseSpaceSafes = useSpaceSafes as jest.MockedFunction<typeof useSpaceSafes>

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

  it('names a spender from the address book, and leaves an unknown one as its address', () => {
    mockWallet()
    mockSpaceSafes(false)
    const multiSpender = asActivePolicy(mockMultiSpenderPolicy())
    const [named, , unnamed] = multiSpender.data.spenders

    render(<SpendingLimitDetails policy={multiSpender} onClose={jest.fn()} />, {
      // The address book selector drops keys that fail checksum validation.
      initialReduxState: {
        addressBook: { [multiSpender.safe.chainId]: { [checksumAddress(named.spender)]: 'Payroll bot' } },
      },
    })

    expect(screen.getByText('Payroll bot')).toBeInTheDocument()
    expect(screen.getByText(getSafeDisplayInfo('', unnamed.spender).shortAddress)).toBeInTheDocument()
  })

  it('renders the usage of the policy the row carries, without fetching it again', () => {
    mockWallet()
    mockSpaceSafes(false)

    setup()

    expect(screen.getAllByRole('progressbar')).toHaveLength(policy.data.spenders[0].allowances.length)
    expect(screen.queryByText('Last updated')).not.toBeInTheDocument()
  })
})
