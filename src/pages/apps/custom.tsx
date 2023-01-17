import { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'

import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import SafeAppsHeader from '@/components/safe-apps/SafeAppsHeader/SafeAppsHeader'
import SafeAppList from '@/components/safe-apps/SafeAppList/SafeAppList'
import SafeAppsSDKLink from '@/components/safe-apps/SafeAppsSDKLink/SafeAppsSDKLink'
import { RemoveCustomAppModal } from '@/components/safe-apps/RemoveCustomAppModal'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'

const CustomSafeApps: NextPage = () => {
  // TODO: create a custom hook instead of use useSafeApps
  const { customSafeApps, customSafeAppsLoading, addCustomApp, removeCustomApp } = useSafeApps()

  const [isOpenRemoveSafeAppModal, setIsOpenRemoveSafeAppModal] = useState<boolean>(false)
  const [customSafeAppToRemove, setCustomSafeAppToRemove] = useState<SafeAppData>()

  const openRemoveCustomAppModal = (customSafeAppToRemove: SafeAppData) => {
    setIsOpenRemoveSafeAppModal(true)
    setCustomSafeAppToRemove(customSafeAppToRemove)
  }

  const onConfirmRemoveCustomAppModal = (safeAppId: number) => {
    removeCustomApp(safeAppId)
    setIsOpenRemoveSafeAppModal(false)
  }

  return (
    <>
      <Head>
        <title>Custom Safe Apps</title>
      </Head>

      <SafeAppsSDKLink />

      <SafeAppsHeader />

      <main>
        <SafeAppList
          safeAppsList={customSafeApps}
          addCustomApp={addCustomApp}
          removeCustomApp={openRemoveCustomAppModal}
        />
      </main>

      {/* remove custom safe app modal */}
      {customSafeAppToRemove && (
        <RemoveCustomAppModal
          open={isOpenRemoveSafeAppModal}
          app={customSafeAppToRemove}
          onClose={() => setIsOpenRemoveSafeAppModal(false)}
          onConfirm={onConfirmRemoveCustomAppModal}
        />
      )}
    </>
  )
}

export default CustomSafeApps
