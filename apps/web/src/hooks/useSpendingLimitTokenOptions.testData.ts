import { faker } from '@faker-js/faker'
import type { TokenOption } from '@/utils/tokenOptions'
import { buildIdentityKey, type TokenOptionsResult } from './useSpendingLimitTokenOptions'

// One Safe per test file, so a re-render with new options keeps the picked token.
const SAFE_ADDRESS = faker.finance.ethereumAddress()

/** A settled `useSpendingLimitTokenOptions` result: these options, nothing loading or failing, for one Safe on `chainId`. */
export const tokenOptionsResult = (
  options: TokenOption[],
  { chainId = '1', safeAddress = SAFE_ADDRESS }: { chainId?: string; safeAddress?: string } = {},
): TokenOptionsResult => ({
  options,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isPopularLoading: false,
  isPopularError: false,
  refetchPopular: jest.fn(),
  identityKey: buildIdentityKey(chainId, safeAddress),
})
