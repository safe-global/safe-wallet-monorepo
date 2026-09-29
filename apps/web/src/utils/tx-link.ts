import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { LinkProps } from 'next/link'
import { AppRoutes } from '@/config/routes'
import type { SpaceIdQuery } from '@/hooks/useUrlSpaceId'

export const getTxLink = (
  txId: string,
  chain: Chain,
  safeAddress: string,
  spaceIdQuery: SpaceIdQuery,
): { href: LinkProps['href']; title: string } => {
  return {
    href: {
      pathname: AppRoutes.transactions.tx,
      query: { id: txId, safe: `${chain?.shortName}:${safeAddress}`, ...spaceIdQuery },
    },
    title: 'View transaction',
  }
}
