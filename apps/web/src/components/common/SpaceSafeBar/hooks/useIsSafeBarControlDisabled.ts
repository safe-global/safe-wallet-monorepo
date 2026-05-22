import { useContext } from 'react'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'

export function useIsSafeBarControlDisabled(): boolean {
  const { txFlow } = useContext(TxModalContext)
  const router = useRouter()
  const isInsideOpenedSafeApp = router.pathname === AppRoutes.apps.open && typeof router.query.appUrl === 'string'
  return !!txFlow || isInsideOpenedSafeApp
}
