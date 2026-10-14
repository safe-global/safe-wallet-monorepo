import type { SafeAccountEntry } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { buildSafeAccountId } from '../SafeAccountSelector/utils'
import type { GuardPolicyBaseFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'

export const CHAIN_ID = '11155111'
export const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
export const SAFE_ID = buildSafeAccountId(CHAIN_ID, SAFE_ADDRESS)

export const safeAccounts = (): SafeAccountEntry[] => [
  { id: SAFE_ID, chainId: CHAIN_ID, address: SAFE_ADDRESS, name: 'Ops Safe', eligibility: 'signer' },
]

/** What `useGuardPolicyStep` hands a step, with the Safe already resolvable by the picker. */
export const guardPolicyStep = <T extends GuardPolicyBaseFormValues>(data?: Partial<T>) => ({
  data: { safe: SAFE_ID, ...data } as T,
  onNext: jest.fn(),
  accountProps: {
    accounts: safeAccounts(),
    isAccountsLoading: false,
    isAccountsError: false,
    onRetryAccounts: jest.fn(),
    hasWallet: true,
    onSafeChange: jest.fn(),
  },
})
