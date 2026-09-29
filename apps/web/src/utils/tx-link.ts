import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { LinkProps } from 'next/link'
import { AppRoutes } from '@/config/routes'
import { withSpaceId } from '@/hooks/useUrlSpaceId'

export const getTxLink = (
  txId: string,
  chain: Chain,
  safeAddress: string,
  spaceId: string | null,
): { href: LinkProps['href']; title: string } => {
  return {
    href: {
      pathname: AppRoutes.transactions.tx,
      query: withSpaceId({ id: txId, safe: `${chain?.shortName}:${safeAddress}` }, spaceId),
    },
    title: 'View transaction',
  }
}
