import { render, screen } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { addressExBuilder } from '@/tests/builders/safe'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { OwnerList } from '.'

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

const { REPLACE_OWNER, REMOVE_OWNER } = SETTINGS_EVENTS.SETUP

const trackedButtons = ({ category, action }: { category: string; action: string }) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-track="${category}: ${action}"] button`))

const getGatedButtons = () => [
  screen.getByTestId('manage-signers-btn'),
  ...trackedButtons(REPLACE_OWNER),
  ...trackedButtons(REMOVE_OWNER),
]

const renderOwnerList = async () => {
  render(<OwnerList />)
  await screen.findByTestId('manage-signers-btn')
}

const mockSafeWithOwners = (ownerCount: number) =>
  mockSafeInfo({
    deployed: true,
    owners: Array.from({ length: ownerCount }, () => addressExBuilder().build()),
  })

describe('OwnerList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeWithOwners(2)
  })

  it.each(['owner', 'proposer', 'nestedOwner'] as const)(
    'enables Manage signers, Replace and Remove for %s',
    async (role) => {
      mockRole(role)

      await renderOwnerList()

      const buttons = getGatedButtons()
      expect(buttons).toHaveLength(5)
      buttons.forEach((button) => expect(button).toBeEnabled())
    },
  )

  it.each(['nonOwner', 'spendingLimitBeneficiary', 'disconnected'] as const)(
    'disables Manage signers, Replace and Remove for %s',
    async (role) => {
      mockRole(role)

      await renderOwnerList()

      const buttons = getGatedButtons()
      expect(buttons).toHaveLength(5)
      buttons.forEach((button) => expect(button).toBeDisabled())
    },
  )

  it('shows no Remove button for a single-owner Safe', async () => {
    mockRole('owner')
    mockSafeWithOwners(1)

    await renderOwnerList()

    expect(trackedButtons(REPLACE_OWNER)).toHaveLength(1)
    expect(trackedButtons(REMOVE_OWNER)).toHaveLength(0)
  })
})
