import { render, screen } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { SpendingLimitsTable } from './SpendingLimitsTable'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const renderTable = () =>
  render(<SpendingLimitsTable spendingLimits={[spendingLimitStateBuilder().build()]} isLoading={false} />)

describe('SpendingLimitsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it.each(['owner', 'proposer', 'nestedOwner'] as const)('enables the delete button for %s', (role) => {
    mockRole(role)

    renderTable()

    expect(screen.getByTestId('delete-btn')).toBeEnabled()
  })

  it.each(['nonOwner', 'spendingLimitBeneficiary', 'disconnected'] as const)(
    'disables the delete button for %s',
    (role) => {
      mockRole(role)

      renderTable()

      expect(screen.getByTestId('delete-btn')).toBeDisabled()
    },
  )
})
