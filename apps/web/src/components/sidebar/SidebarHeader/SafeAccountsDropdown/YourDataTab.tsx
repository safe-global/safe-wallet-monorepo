import type { ReactElement } from 'react'
import { useState } from 'react'
import { Box, Typography, Button, SvgIcon } from '@mui/material'

import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import ExportIcon from '@/public/images/common/export.svg'
import ImportIcon from '@/public/images/common/import.svg'
import { exportAppData } from '@/components/settings/DataManagement'
import { ImportDialog } from '@/components/settings/DataManagement/ImportDialog'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import Track from '@/components/common/Track'

import css from './styles.module.css'

/**
 * Your Data tab content
 * Displays information about data management and Import/Export buttons
 */
export const YourDataTab = (): ReactElement => {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [fileName, setFileName] = useState<string>()
  const [jsonData, setJsonData] = useState<string>()
  const addressBook = useAppSelector(selectAllAddressBooks)
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const hasData = Object.keys(addressBook).length > 0 || Object.keys(addedSafes).length > 0

  const onImport = () => {
    setImportModalOpen(true)
  }

  const onClose = () => {
    setImportModalOpen(false)
  }

  return (
    <>
      <Box className={css.yourDataContent}>
        <Typography className={css.yourDataDescription}>
          Download or upload your local data with your added Safe Accounts, address book and settings.
        </Typography>

        <Box className={css.yourDataButtons}>
          {hasData && (
            <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={OVERVIEW_LABELS.sidebar_dropdown}>
              <Button
                variant="outlined"
                size="medium"
                onClick={exportAppData}
                startIcon={<SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />}
                fullWidth
              >
                Export Data
              </Button>
            </Track>
          )}
          <Track {...OVERVIEW_EVENTS.IMPORT_DATA} label={OVERVIEW_LABELS.sidebar_dropdown}>
            <Button
              data-testid="import-btn"
              variant="outlined"
              size="medium"
              onClick={onImport}
              startIcon={<SvgIcon component={ImportIcon} inheritViewBox fontSize="small" />}
              fullWidth
            >
              Import Data
            </Button>
          </Track>
        </Box>
      </Box>

      {importModalOpen && (
        <ImportDialog
          fileName={fileName}
          setFileName={setFileName}
          jsonData={jsonData}
          setJsonData={setJsonData}
          onClose={onClose}
        />
      )}
    </>
  )
}
