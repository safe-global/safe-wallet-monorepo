import { useCallback, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import type { SafeItem } from '@/hooks/safes'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import { AppRoutes } from '@/config/routes'
import useChains from '@/hooks/useChains'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { ESafeAction } from '@/features/spaces/store'

type SafeActionHandler = (safe: SafeItem) => Promise<void>

interface UseSafeActionMapperOptions {
  onReceiveComplete: () => void
}

const useSafeActionMapper = ({
  onReceiveComplete,
}: UseSafeActionMapperOptions): Record<ESafeAction, SafeActionHandler> => {
  const router = useRouter()
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

  return useMemo(
    () => ({
      [ESafeAction.Send]: async (safe) => {
        await navigateToSafe(safe)
        setTxFlow(<NewTxFlow />, undefined, false)
      },

      [ESafeAction.Receive]: async (safe) => {
        await navigateToSafe(safe)
        onReceiveComplete()
      },

      [ESafeAction.Swap]: async (safe) => {
        const safeParam = getSafeQueryParam(safe)
        await router.push({
          pathname: AppRoutes.swap,
          query: { safe: safeParam },
        })
      },

      [ESafeAction.BuildTransaction]: async (safe) => {
        const safeParam = getSafeQueryParam(safe)
        await router.push({
          pathname: txBuilderLink.pathname,
          query: { ...(txBuilderLink.query as Record<string, string>), safe: safeParam },
        })
      },
    }),
    [router, setTxFlow, getSafeQueryParam, navigateToSafe, onReceiveComplete, txBuilderLink],
  )
}

export default useSafeActionMapper
