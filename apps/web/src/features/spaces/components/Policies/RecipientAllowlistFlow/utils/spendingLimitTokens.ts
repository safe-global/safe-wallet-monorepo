import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  getPolicyStatus,
  isSpendingLimitPolicy,
  type Policy,
  type PolicySafe,
  type PolicyTokenInfo,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'

const isActiveOrQueued = (policy: Policy): policy is Extract<Policy, { type: 'spending-limit' }> =>
  isSpendingLimitPolicy(policy) &&
  (policy.status === 'pending' ? policy.enabled && policy.operation !== 'remove' : getPolicyStatus(policy) === 'active')

/** The tokens of the active and queued spending limits on `safe`, each once. */
export const getSpendingLimitTokens = (policies: readonly Policy[], safe: PolicySafe): PolicyTokenInfo[] =>
  policies
    .filter(isActiveOrQueued)
    .filter((policy) => policy.safe.chainId === safe.chainId && sameAddress(policy.safe.address, safe.address))
    .flatMap(({ data }) =>
      data.spenders
        .filter(({ isActive }) => isActive !== false)
        .flatMap(({ allowances }) => allowances.filter(({ change }) => change !== 'removed').map(({ token }) => token)),
    )
    .filter((token, index, tokens) => tokens.findIndex(({ address }) => sameAddress(address, token.address)) === index)

/** A spending limit's token as a pickable option, for one the Safe neither holds nor finds among the popular ones. */
export const toSpendingLimitTokenOption = ({ address, symbol, decimals, logoUri }: PolicyTokenInfo): TokenOption => ({
  address,
  symbol,
  name: '',
  decimals,
  logoUri: logoUri ?? undefined,
  group: 'custom',
})
