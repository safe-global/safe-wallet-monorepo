import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

// A wallet must never reload mid-transaction, so an SW update only surfaces a
// toast and the user triggers the reload. useRegisterSW is the single SW
// registration (injectRegister is false in the VitePWA config).
const PwaReloadPrompt = (): null => {
  const dispatch = useAppDispatch()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh) {
      return
    }

    dispatch(
      showNotification({
        message: 'A new version of Safe is available.',
        variant: 'info',
        groupKey: 'pwa-update',
        // Must not vanish on the default 5s auto-hide — the user has to act on it.
        autoHideDuration: null,
        link: {
          onClick: () => updateServiceWorker(true),
          title: 'Reload',
        },
      }),
    )
  }, [needRefresh, dispatch, updateServiceWorker])

  return null
}

export default PwaReloadPrompt
