import type { ReactElement, ReactNode } from 'react'
import { Download, Info, Upload } from 'lucide-react'

import { OVERVIEW_EVENTS, type OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import Track from '@/components/common/Track'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type DataWidgetViewProps = {
  isDarkMode: boolean
  hasData: boolean
  trackingLabel: OVERVIEW_LABELS
  onExport: () => void
  onImport: () => void
  importDialog: ReactNode
}

export const DataWidgetView = ({
  isDarkMode,
  hasData,
  trackingLabel,
  onExport,
  onImport,
  importDialog,
}: DataWidgetViewProps): ReactElement => {
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
            <Button variant="outline" className="flex-1" onClick={onExport}>
              <Download className="size-4" />
              Export
            </Button>
          </Track>
        )}

        <Track {...OVERVIEW_EVENTS.IMPORT_DATA} label={trackingLabel}>
          <Button data-testid="import-btn" variant="outline" className="flex-1" onClick={onImport}>
            <Upload className="size-4" />
            Import
          </Button>
        </Track>
      </div>

      {importDialog}
    </div>
  )
}
