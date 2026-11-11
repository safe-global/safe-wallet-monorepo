import { useCallback, useContext, useMemo, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import type { SafeItem } from '@/hooks/safes'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow, TokenTransferFlow } from '@/components/tx-flow/flows'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { ESafeAction } from '@/features/spaces/store'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'

type SafeActionHandler = (safe: SafeItem) => Promise<void>

// Not via the URL: a step swapping the flow runs the previous onClose, which would strip the Safe mid-flow
const withSafeScope = (safe: SafeItem, txFlow: ReactElement): ReactElement => (
  <SafeScopeProvider initial={{ chainId: safe.chainId, safeAddress: safe.address }}>{txFlow}</SafeScopeProvider>
)

interface UseSafeActionMapperOptions {
  onReceiveComplete: () => void
}

interface UseSafeActionMapperResult {
  actionMapper: Record<ESafeAction, SafeActionHandler>
  resetActiveSafe: () => Promise<void>
}

const useSafeActionMapper = ({ onReceiveComplete }: UseSafeActionMapperOptions): UseSafeActionMapperResult => {
  const router = useRouter()
  const spaceId = useUrlSpaceId()
  const { setTxFlow } = useContext(TxModalContext)
  const { configs: chains } = useChains()
  const { link: txBuilderLink } = useTxBuilderApp()

  const getShortName = useCallback(
    (chainId: string) => chains.find((c) => c.chainId === chainId)?.shortName ?? '',
    [chains],
  )

  const getSafeQueryParam = useCallback(
    (safe: SafeItem) => {
      const shortName = getShortName(safe.chainId)
      return `${shortName}:${safe.address}`
    },
    [getShortName],
  )

  const navigateToSafe = useCallback(
    (safe: SafeItem) => {
      const safeParam = getSafeQueryParam(safe)
      return router.replace({
        pathname: router.pathname,
        query: { ...router.query, safe: safeParam },
      })
    },
    [router, getSafeQueryParam],
  )

  // Clears the safe/chain query params so the topbar drops the selected-safe context
  // after the user closes the Receive QR modal, which still reads the Safe from the URL.
  const resetActiveSafe = useCallback(async () => {
    const { safe: _safe, chain: _chain, ...rest } = router.query
    await router.replace({
      pathname: router.pathname,
      query: rest,
    })
  }, [router])

  const actionMapper = useMemo<Record<ESafeAction, SafeActionHandler>>(
    () => ({
      [ESafeAction.Send]: async (safe) => {
        setTxFlow(withSafeScope(safe, <TokenTransferFlow />), undefined, false)
      },

      [ESafeAction.Receive]: async (safe) => {
        await navigateToSafe(safe)
        onReceiveComplete()
      },

      [ESafeAction.Swap]: async (safe) => {
        const safeParam = getSafeQueryParam(safe)
        await router.push({
          pathname: AppRoutes.swap,
          query: withSpaceId({ safe: safeParam }, spaceId),
        })
      },

      [ESafeAction.BuildTransaction]: async (safe) => {
        const safeParam = getSafeQueryParam(safe)
        await router.push({
          pathname: txBuilderLink.pathname,
          query: { ...(txBuilderLink.query as Record<string, string>), safe: safeParam },
        })
      },

      [ESafeAction.NewTransaction]: async (safe) => {
        setTxFlow(withSafeScope(safe, <NewTxFlow />), undefined, false)
      },
    }),
    [router, setTxFlow, getSafeQueryParam, navigateToSafe, onReceiveComplete, txBuilderLink, spaceId],
  )

  return { actionMapper, resetActiveSafe }
}

export default useSafeActionMapper
