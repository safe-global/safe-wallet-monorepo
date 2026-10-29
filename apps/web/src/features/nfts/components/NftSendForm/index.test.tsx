import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { chainBuilder } from '@/tests/builders/chains'
import { collectibleBuilder } from '@/tests/builders/collectibles'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { render, screen } from '@/tests/test-utils'
import NftSendForm from '.'

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

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => chainBuilder().build()),
}))

const NO_NFTS: Collectible[] = []

const SELECTION = {
  'one NFT selected': [collectibleBuilder().build()],
  'no NFT selected': NO_NFTS,
}

type Selection = keyof typeof SELECTION

describe('NftSendForm role gating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it.each<{ role: TestRole; selection: Selection; disabled: boolean }>([
    { role: 'owner', selection: 'one NFT selected', disabled: false },
    { role: 'owner', selection: 'no NFT selected', disabled: true },
    { role: 'nonOwner', selection: 'one NFT selected', disabled: true },
    { role: 'disconnected', selection: 'one NFT selected', disabled: true },
  ])('sets disabled=$disabled for a $role with $selection', ({ role, selection, disabled }) => {
    mockRole(role)

    render(<NftSendForm selectedNfts={SELECTION[selection]} />)

    expect(screen.getByRole('button', { name: /^Send/ })).toHaveProperty('disabled', disabled)
  })
})
