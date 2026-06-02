import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

/**
 * Surfaces a non-blocking "new version available" toast when the service
 * worker has a waiting update (Decision 2 / D2-a). A wallet must never reload
 * mid-transaction, so the user controls the reload.
 *
 * `useRegisterSW` performs the single SW registration — `injectRegister` is
 * `false` in the VitePWA config so there is no competing auto-injected script.
 */
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
