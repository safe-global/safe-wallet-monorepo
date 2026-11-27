import type Safe from '@safe-global/protocol-kit'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsOnlySpendingLimitBeneficiary } from '@/features/spending-limits'
import { connectedWalletBuilder } from '@/tests/builders/wallet'

export type TestRole =
  | 'owner'
  | 'nonOwner'
  | 'disconnected'
  | 'proposer'
  | 'proposerAndOwner'
  | 'spendingLimitBeneficiary'
  | 'nestedOwner'
  | 'wrongChain'

export type RoleFlags = {
  isConnected: boolean
  isSafeOwner: boolean
  isProposer: boolean
  isSpendingLimitBeneficiary: boolean
  isNestedSafeOwner: boolean
  isWrongChain: boolean
}

const CONNECTED_WITHOUT_ROLE: RoleFlags = {
  isConnected: true,
  isSafeOwner: false,
  isProposer: false,
  isSpendingLimitBeneficiary: false,
  isNestedSafeOwner: false,
  isWrongChain: false,
}

const ROLE_FLAGS: Record<TestRole, RoleFlags> = {
  owner: { ...CONNECTED_WITHOUT_ROLE, isSafeOwner: true },
  nonOwner: CONNECTED_WITHOUT_ROLE,
  disconnected: { ...CONNECTED_WITHOUT_ROLE, isConnected: false },
  proposer: { ...CONNECTED_WITHOUT_ROLE, isProposer: true },
  proposerAndOwner: { ...CONNECTED_WITHOUT_ROLE, isSafeOwner: true, isProposer: true },
  spendingLimitBeneficiary: { ...CONNECTED_WITHOUT_ROLE, isSpendingLimitBeneficiary: true },
  nestedOwner: { ...CONNECTED_WITHOUT_ROLE, isNestedSafeOwner: true },
  wrongChain: { ...CONNECTED_WITHOUT_ROLE, isSafeOwner: true, isWrongChain: true },
}

const INITIALIZED_SDK = {} as Safe

const asMock = <T extends (...args: never[]) => unknown>(hook: T) => {
  const mocked = jest.mocked(hook)
  if (!jest.isMockFunction(hook)) {
    throw new Error(`mockRole: ${hook.name} is not mocked. Mock its module with jest.mock().`)
  }
  return mocked
}

export function mockRole(role: TestRole, overrides: Partial<RoleFlags> = {}) {
  const flags = { ...ROLE_FLAGS[role], ...overrides }
  const wallet = flags.isConnected ? connectedWalletBuilder().build() : null

  asMock(useWallet).mockReturnValue(wallet)
  asMock(useIsSafeOwner).mockReturnValue(flags.isSafeOwner)
  asMock(useIsWalletProposer).mockReturnValue(flags.isProposer)
  asMock(useIsOnlySpendingLimitBeneficiary).mockReturnValue(flags.isSpendingLimitBeneficiary)
  asMock(useIsNestedSafeOwner).mockReturnValue(flags.isNestedSafeOwner)
  asMock(useIsWrongChain).mockReturnValue(flags.isWrongChain)
  asMock(useSafeSDK).mockReturnValue(INITIALIZED_SDK)

  return wallet
}
