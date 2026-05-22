import { useContext } from 'react'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { useSafeAppUrl } from '@/hooks/safe-apps/useSafeAppUrl'

// Returns true when Safe-bar controls (Safe selector, chain selector, nested safes)
// should be disabled. Current reasons: an open tx flow, or being inside a loaded
// Safe App (/apps/open with a resolved appUrl). Extend here when adding a new reason.
export function useIsSafeBarControlDisabled(): boolean {
  const { txFlow } = useContext(TxModalContext)
  const router = useRouter()
  const appUrl = useSafeAppUrl()
  const isInsideOpenedSafeApp = router.pathname === AppRoutes.apps.open && Boolean(appUrl)
  return !!txFlow || isInsideOpenedSafeApp
}
