import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import type { RecoveryStateItem } from '@/features/recovery'
import { DelayModifierRow } from '../DelayModifierRow'

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

const delayModifierBuilder = (recoverers: string[]): RecoveryStateItem => ({
  address: fakerChecksummedAddress(),
  recoverers,
  expiry: 0n,
  delay: 0n,
  txNonce: 0n,
  queueNonce: 0n,
  queue: [],
})

const mockConnectedRole = (role: TestRole) => {
  const wallet = mockRole(role)
  if (!wallet) throw new Error(`The ${role} role has no connected wallet`)
  return wallet.address
}

const EDIT_BUTTON = 'edit-recoverer-btn'
const REMOVE_BUTTON = 'remove-recoverer-btn'

describe('DelayModifierRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it('shows enabled edit and remove buttons to an owner', () => {
    mockRole('owner')

    render(<DelayModifierRow delayModifier={delayModifierBuilder([fakerChecksummedAddress()])} />)

    expect(screen.getByTestId(EDIT_BUTTON)).toBeEnabled()
    expect(screen.getByTestId(REMOVE_BUTTON)).toBeEnabled()
  })

  it('hides the edit and remove buttons from the recoverer', () => {
    const recoverer = mockConnectedRole('nonOwner')

    render(<DelayModifierRow delayModifier={delayModifierBuilder([recoverer])} />)

    expect(screen.queryByTestId(EDIT_BUTTON)).not.toBeInTheDocument()
    expect(screen.queryByTestId(REMOVE_BUTTON)).not.toBeInTheDocument()
  })

  it.each(['nonOwner', 'proposer', 'nestedOwner', 'disconnected'] as const)(
    'hides the edit and remove buttons from %s',
    (role) => {
      mockRole(role)

      render(<DelayModifierRow delayModifier={delayModifierBuilder([fakerChecksummedAddress()])} />)

      expect(screen.queryByTestId(EDIT_BUTTON)).not.toBeInTheDocument()
      expect(screen.queryByTestId(REMOVE_BUTTON)).not.toBeInTheDocument()
    },
  )
})
