import { useCallback, useState } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

type ReturnType = {
  isPreviewDrawerOpen: boolean
  previewDrawerApp: SafeAppData | undefined
  openPreviewDrawer: (safeApp: SafeAppData) => void
  closePreviewDrawer: () => void
}

const useSafeAppPreviewDrawer = (): ReturnType => {
  const [previewDrawerApp, setPreviewDrawerApp] = useState<SafeAppData>()
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState<boolean>(false)

  const openPreviewDrawer = useCallback((safeApp: SafeAppData) => {
    setPreviewDrawerApp(safeApp)
    setIsPreviewDrawerOpen(true)
  }, [])

  const closePreviewDrawer = useCallback(() => {
    setIsPreviewDrawerOpen(false)
  }, [])

  return { isPreviewDrawerOpen, previewDrawerApp, openPreviewDrawer, closePreviewDrawer }
}

export default useSafeAppPreviewDrawer
