import { useContext } from 'react'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'

// Returns true when Safe-bar controls (Safe selector, chain selector, nested safes)
// should be disabled. Current reasons: an open tx flow, or being inside a loaded
// Safe App (/apps/open with a non-empty appUrl). Extend here when adding a new reason.
export function useIsSafeBarControlDisabled(): boolean {
  const { txFlow } = useContext(TxModalContext)
  const router = useRouter()
  const { appUrl } = router.query
  const isInsideOpenedSafeApp =
    router.pathname === AppRoutes.apps.open && typeof appUrl === 'string' && appUrl.length > 0
  return !!txFlow || isInsideOpenedSafeApp
}
