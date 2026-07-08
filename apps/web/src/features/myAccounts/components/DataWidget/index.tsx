import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
      <CardHeader className={css.cardHeader}>
        <div className="flex items-center justify-center gap-1">
          <b>{hasData ? 'Export or import your Safe data' : 'Import your Safe data'}</b>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <InfoIcon className={css.infoIcon} />
            </TooltipTrigger>
            <TooltipContent side="top">
              Download or upload your local data with your added Safe accounts, address book and settings.
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mx-auto flex max-w-[240px] justify-center gap-4">
          {hasData && (
            <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={trackingLabel}>
              <Button variant="outline" size="sm" onClick={exportAppData} className="mt-2 w-full">
                <ExportIcon className="size-4" />
                Export
              </Button>
            </Track>
          )}
          <Track {...OVERVIEW_EVENTS.IMPORT_DATA} label={trackingLabel}>
            <Button data-testid="import-btn" variant="outline" size="sm" onClick={onImport} className="mt-2 w-full">
              <ImportIcon className="size-4" />
              Import
            </Button>
          </Track>
        </div>
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
