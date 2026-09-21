import { useState } from 'react'
import type { ReactElement } from 'react'
import { Download, Info, Upload } from 'lucide-react'
import { useRouter } from 'next/router'

import { useAppSelector } from '@/store'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { exportAppData } from '@/components/settings/DataManagement'
import { ImportDialog } from '@/components/settings/DataManagement/ImportDialog'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

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
    <div className={cn('shadcn-scope flex flex-col items-center gap-2 py-6', isDarkMode && 'dark')}>
      <div className="flex items-center gap-1">
        <Typography variant="paragraph">
          {hasData ? 'Export or import your Safe data' : 'Import your Safe data'}
        </Typography>

        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex cursor-default text-muted-foreground" />}>
            <Info className="size-4" />
          </TooltipTrigger>
          <TooltipContent>
            Download or upload your local data with your added Safe accounts, address book and settings.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex w-full max-w-[240px] justify-center gap-4">
        {hasData && (
          <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={trackingLabel}>
            <Button variant="outline" className="flex-1" onClick={exportAppData}>
              <Download className="size-4" />
              Export
            </Button>
          </Track>
        )}

        <Track {...OVERVIEW_EVENTS.IMPORT_DATA} label={trackingLabel}>
          <Button
            data-testid="import-btn"
            variant="outline"
            className="flex-1"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="size-4" />
            Import
          </Button>
        </Track>
      </div>

      {importModalOpen && (
        <ImportDialog
          fileName={fileName}
          setFileName={setFileName}
          jsonData={jsonData}
          setJsonData={setJsonData}
          onClose={() => setImportModalOpen(false)}
        />
      )}
    </div>
  )
}
