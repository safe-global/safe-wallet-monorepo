import { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'

import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import SafeAppsHeader from '@/components/safe-apps/SafeAppsHeader'
import SafeAppList from '@/components/safe-apps/SafeAppList'
import { RemoveCustomAppModal } from '@/components/safe-apps/RemoveCustomAppModal'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { SAFE_APPS_LABELS } from '@/services/analytics'
import { BRAND_NAME } from '@/config/constants'
import { CustomSafeAppsView } from '@views/pages/apps/CustomSafeAppsView'

const CustomSafeApps: NextPage = () => {
  // TODO: create a custom hook instead of use useSafeApps
  const { customSafeApps, addCustomApp, removeCustomApp } = useSafeApps()

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
        <title>{`${BRAND_NAME} – Custom Safe Apps`}</title>
      </Head>

      <SafeAppsHeader />

      <CustomSafeAppsView
        renderAppList={({ title }) => (
          <SafeAppList
            title={title}
            safeAppsList={customSafeApps}
            addCustomApp={addCustomApp}
            removeCustomApp={openRemoveCustomAppModal}
            eventLabel={SAFE_APPS_LABELS.apps_custom}
          />
        )}
      />

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
