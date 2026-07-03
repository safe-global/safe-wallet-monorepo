import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import FileIcon from '@/public/images/settings/data/file.svg'
import ExportIcon from '@/public/images/common/export.svg'
import { getPersistedState, useAppSelector } from '@/store'
import { addressBookSlice, selectAllAddressBooks } from '@/store/addressBookSlice'
import { addedSafesSlice, selectAllAddedSafes } from '@/store/addedSafesSlice'
import { safeAppsSlice, selectSafeApps } from '@/store/safeAppsSlice'
import { selectSettings, settingsSlice } from '@/store/settingsSlice'
import { selectUndeployedSafes, undeployedSafesSlice } from '@/features/counterfactual/store'
import { ImportFileUpload } from '@/components/settings/DataManagement/ImportFileUpload'
import { ImportDialog } from '@/components/settings/DataManagement/ImportDialog'
import { SAFE_EXPORT_VERSION } from '@/components/settings/DataManagement/useGlobalImportFileParser'
import { FileListCard } from '@/components/settings/DataManagement/FileListCard'
import { selectAllVisitedSafes, visitedSafesSlice } from '@/store/visitedSafesSlice'

import css from './styles.module.css'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { ClearPendingTxs } from '../ClearPendingTxs'
import SettingsCard from '../SettingsCard'

const getExportFileName = () => {
  const today = new Date().toISOString().slice(0, 10)
  return `safe-${today}.json`
}

export const exportAppData = () => {
  // Extract the slices we want to export
  const {
    [addressBookSlice.name]: addressBook,
    [addedSafesSlice.name]: addedSafes,
    [settingsSlice.name]: setting,
    [safeAppsSlice.name]: safeApps,
    [undeployedSafesSlice.name]: undeployedSafes,
    [visitedSafesSlice.name]: visitedSafes,
  } = getPersistedState()

  // Ensure they are under the same name as the slice
  const exportData = {
    [addressBookSlice.name]: addressBook,
    [addedSafesSlice.name]: addedSafes,
    [settingsSlice.name]: setting,
    [safeAppsSlice.name]: safeApps,
    [undeployedSafesSlice.name]: undeployedSafes,
    [visitedSafesSlice.name]: visitedSafes,
  }

  const data = JSON.stringify({ version: SAFE_EXPORT_VERSION.V3, data: exportData })

  const blob = new Blob([data], { type: 'text/json' })
  const link = document.createElement('a')

  link.download = getExportFileName()
  link.href = window.URL.createObjectURL(blob)
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':')
  link.dispatchEvent(new MouseEvent('click'))
}

const DataManagement = () => {
  const [exportFileName, setExportFileName] = useState('')
  const [importFileName, setImportFileName] = useState<string>()
  const [jsonData, setJsonData] = useState<string>()

  const addedSafes = useAppSelector(selectAllAddedSafes)
  const addressBook = useAppSelector(selectAllAddressBooks)
  const settings = useAppSelector(selectSettings)
  const visitedSafes = useAppSelector(selectAllVisitedSafes)
  const safeApps = useAppSelector(selectSafeApps)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)

  useEffect(() => {
    // Prevent hydration errors
    setExportFileName(getExportFileName())
  }, [])

  return (
    <>
      <SettingsCard title="Data export" className="mb-4" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div data-testid="export-file-section">
          <Typography>Download your local data with your added Safe accounts, address book and settings.</Typography>

          <FileListCard
            avatar={
              <div className={`${css.fileIcon} rounded`}>
                <FileIcon className="size-4 fill-none" />
              </div>
            }
            title={<b>{exportFileName}</b>}
            action={
              <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={OVERVIEW_LABELS.settings}>
                <Button className={css.exportIcon} onClick={exportAppData}>
                  <ExportIcon className="size-4" />
                </Button>
              </Track>
            }
            addedSafes={addedSafes}
            addressBook={addressBook}
            settings={settings}
            visitedSafes={visitedSafes}
            safeApps={safeApps}
            undeployedSafes={undeployedSafes}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Data import" className="mb-4" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div>
          <ImportFileUpload setFileName={setImportFileName} setJsonData={setJsonData} />
        </div>

        {jsonData && (
          <ImportDialog
            jsonData={jsonData}
            fileName={importFileName}
            setJsonData={setJsonData}
            setFileName={setImportFileName}
          />
        )}
      </SettingsCard>

      <SettingsCard title="Pending transactions" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div data-testid="clear-pending-tx-section">
          <ClearPendingTxs />
        </div>
      </SettingsCard>
    </>
  )
}

export default DataManagement
