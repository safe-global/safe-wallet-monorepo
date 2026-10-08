import { useState } from 'react'
import type { ReactElement } from 'react'
import { useRouter } from 'next/router'

import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { exportAppData } from '@/components/settings/DataManagement'
import { ImportDialog } from '@/components/settings/DataManagement/ImportDialog'
import { OVERVIEW_LABELS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import { useDarkMode } from '@/hooks/useDarkMode'
import { DataWidgetView } from '@views/features/myAccounts/components/DataWidget/DataWidgetView'

export const DataWidget = (): ReactElement => {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [fileName, setFileName] = useState<string>()
  const [jsonData, setJsonData] = useState<string>()
  const addressBook = useAppSelector(selectAllAddressBooks)
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const router = useRouter()
  const isDarkMode = useDarkMode()
  const hasData = Object.keys(addressBook).length > 0 || Object.keys(addedSafes).length > 0
  const trackingLabel =
    router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  return (
    <DataWidgetView
      isDarkMode={isDarkMode}
      hasData={hasData}
      trackingLabel={trackingLabel}
      onExport={exportAppData}
      onImport={() => setImportModalOpen(true)}
      importDialog={
        importModalOpen && (
          <ImportDialog
            fileName={fileName}
            setFileName={setFileName}
            jsonData={jsonData}
            setJsonData={setJsonData}
            onClose={() => setImportModalOpen(false)}
          />
        )
      }
    />
  )
}
