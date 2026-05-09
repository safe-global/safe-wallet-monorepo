import { Button, SvgIcon, Card, CardHeader, CardContent, Tooltip, Box } from '@mui/material'
import { useState } from 'react'
import type { ReactElement } from 'react'

import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import ExportIcon from '@/public/images/common/export.svg'
import ImportIcon from '@/public/images/common/import.svg'
import { exportAppData } from '@/components/settings/DataManagement'
import { ImportDialog } from '@/components/settings/DataManagement/ImportDialog'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import Track from '@/components/common/Track'
import InfoIcon from '@/public/images/notifications/info.svg'

import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'

export const DataWidget = (): ReactElement => {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [fileName, setFileName] = useState<string>()
  const [jsonData, setJsonData] = useState<string>()
  const addressBook = useAppSelector(selectAllAddressBooks)
  const addedSafes = useAppSelector(selectAllAddedSafes)
  const router = useRouter()
  const hasData = Object.keys(addressBook).length > 0 || Object.keys(addedSafes).length > 0
  const trackingLabel =
    router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const onImport = () => {
    setImportModalOpen(true)
  }

  const onClose = () => {
    setImportModalOpen(false)
  }

  return (
    <Card className={css.card}>
      <CardHeader
        className={css.cardHeader}
        title={
          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <b>{hasData ? 'Export or import your Safe data' : 'Import your Safe data'}</b>
            <Tooltip
              title="Download or upload your local data with your added Safe Accounts, address book and settings."
              placement="top"
              arrow
            >
              <span>
                <InfoIcon className={css.infoIcon} />
              </span>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        <Box display="flex" gap={2} justifyContent="center" sx={{ maxWidth: 240, margin: 'auto' }}>
          {hasData && (
            <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={trackingLabel}>
              <Button
                variant="outlined"
                size="small"
                onClick={exportAppData}
                startIcon={<SvgIcon component={ExportIcon} inheritViewBox fontSize="small" />}
                sx={{ width: '100%', py: 0.5, px: 2, mt: 2 }}
              >
                Export
              </Button>
            </Track>
          )}
          <Track {...OVERVIEW_EVENTS.IMPORT_DATA} label={trackingLabel}>
            <Button
              data-testid="import-btn"
              variant="outlined"
              size="small"
              onClick={onImport}
              startIcon={<SvgIcon component={ImportIcon} inheritViewBox fontSize="small" />}
              sx={{ width: '100%', py: 0.5, px: 2, mt: 2 }}
            >
              Import
            </Button>
          </Track>
        </Box>
      </CardContent>
      {importModalOpen && (
        <ImportDialog
          fileName={fileName}
          setFileName={setFileName}
          jsonData={jsonData}
          setJsonData={setJsonData}
          onClose={onClose}
        />
      )}
    </Card>
  )
}
