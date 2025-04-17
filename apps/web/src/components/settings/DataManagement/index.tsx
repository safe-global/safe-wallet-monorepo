import { useEffect, useState } from 'react'
import { Paper, Grid, Typography, Button, SvgIcon, Box } from '@mui/material'

import FileIcon from '@/public/images/settings/data/file.svg'
import ExportIcon from '@/public/images/common/export.svg'
import { getPersistedState, useAppSelector } from '@/store'
import { addressBookSlice, selectAllAddressBooks } from '@/store/addressBookSlice'
import { addedSafesSlice, selectAllAddedSafes } from '@/store/addedSafesSlice'
import { safeAppsSlice, selectSafeApps } from '@/store/safeAppsSlice'
import { selectSettings, settingsSlice } from '@/store/settingsSlice'
import { selectUndeployedSafes, undeployedSafesSlice } from '@/features/counterfactual/store/undeployedSafesSlice'
import { ImportFileUpload } from '@/components/settings/DataManagement/ImportFileUpload'
import { ImportDialog } from '@/components/settings/DataManagement/ImportDialog'
import { SAFE_EXPORT_VERSION } from '@/components/settings/DataManagement/useGlobalImportFileParser'
import { FileListCard } from '@/components/settings/DataManagement/FileListCard'
import { selectAllVisitedSafes, visitedSafesSlice } from '@/store/visitedSafesSlice'

import css from './styles.module.css'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { ClearPendingTxs } from '../ClearPendingTxs'

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
      <Paper sx={{ p: 4, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item sm={4} xs={12}>
            <Typography variant="h4" fontWeight={700}>
              Data export
            </Typography>
          </Grid>

          <Grid data-testid="export-file-section" item container xs>
            <Typography>Download your local data with your added Safe Accounts, address book and settings.</Typography>

            <FileListCard
              avatar={
                <Box className={css.fileIcon} sx={{ borderRadius: ({ shape }) => `${shape.borderRadius}px` }}>
                  <SvgIcon component={FileIcon} inheritViewBox fontSize="small" sx={{ fill: 'none' }} />
                </Box>
              }
              title={<b>{exportFileName}</b>}
              action={
                <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={OVERVIEW_LABELS.settings}>
                  <Button variant="contained" className={css.exportIcon} onClick={exportAppData}>
                    <SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />
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
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 4, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item sm={4} xs={12}>
            <Typography variant="h4" fontWeight={700}>
              Data import
            </Typography>
          </Grid>

          <Grid item xs>
            <ImportFileUpload setFileName={setImportFileName} setJsonData={setJsonData} />
          </Grid>

          {jsonData && (
            <ImportDialog
              jsonData={jsonData}
              fileName={importFileName}
              setJsonData={setJsonData}
              setFileName={setImportFileName}
            />
          )}
        </Grid>
      </Paper>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item sm={4} xs={12}>
            <Typography variant="h4" fontWeight={700}>
              Pending transactions
            </Typography>
          </Grid>

          <Grid data-testid="clear-pending-tx-section" item container xs>
            <ClearPendingTxs />
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default DataManagement
