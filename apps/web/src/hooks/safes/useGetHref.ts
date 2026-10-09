import { AppRoutes } from '@/config/routes'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type NextRouter } from 'next/router'
import { useCallback } from 'react'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useSafeWorkspacePicker } from '@/hooks/useSafeWorkspacePicker'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'

/**
 * Navigate to the dashboard when selecting a safe on the welcome page,
 * navigate to the history when selecting a safe on a single tx page,
 * otherwise keep the current route
 */
export const useGetHref = (router: NextRouter) => {
  const isSpacePage = useIsSpaceRoute()
  const isWelcomePage = router.pathname === AppRoutes.welcome.accounts
  const isSingleTxPage = router.pathname === AppRoutes.transactions.tx
  const spaceId = useUrlSpaceId()
  const pickWorkspace = useSafeWorkspacePicker(isWelcomePage)

  return useCallback(
    (chain: Chain, address: string) => {
      const safe = `${chain.shortName}:${address}`
      const pathname =
        isWelcomePage || isSpacePage
          ? AppRoutes.home
          : isSingleTxPage
            ? AppRoutes.transactions.history
            : router.pathname

      // A Workspace page keeps only its Workspace; a Safe page keeps its whole query, spaceId included
      if (isSpacePage) return { pathname, query: withSpaceId({ safe }, spaceId) }
      if (!isWelcomePage) return { pathname, query: { ...router.query, safe } }

      // My accounts opens the Safe in its Workspace when no choice is needed; the Safe page asks otherwise
      const pick = pickWorkspace(chain.chainId, address)
      return { pathname, query: withSpaceId({ ...router.query, safe }, pick?.kind === 'one' ? pick.spaceId : null) }
    },
    [isSingleTxPage, isWelcomePage, isSpacePage, spaceId, router.pathname, router.query, pickWorkspace],
  )
}
