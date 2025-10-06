import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { LinkProps } from 'next/link'
import { AppRoutes } from '@/config/routes'

export const getTxLink = (
  txId: string,
  chain: Chain,
  safeAddress: string,
): { href: LinkProps['href']; title: string } => {
  return {
    href: {
      pathname: AppRoutes.transactions.tx,
      query: { id: txId, safe: `${chain?.shortName}:${safeAddress}` },
    },
    title: 'View transaction',
  }
}
