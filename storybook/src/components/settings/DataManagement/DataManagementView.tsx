import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import FileIcon from '@/public/images/settings/data/file.svg'
import ExportIcon from '@/public/images/common/export.svg'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics/events/overview'
import SettingsCard from '@/components/settings/SettingsCard'
import type { FileListCardHeaderProps } from './FileListCardView'

import css from './styles.module.css'

export type DataManagementViewProps = {
  exportFileName: string
  onExport: () => void
  renderExportFileList: (props: FileListCardHeaderProps) => ReactNode
  importUpload: ReactNode
  importDialog?: ReactNode
  clearPendingTxs: ReactNode
}

export const DataManagementView = ({
  exportFileName,
  onExport,
  renderExportFileList,
  importUpload,
  importDialog,
  clearPendingTxs,
}: DataManagementViewProps) => {
  return (
    <>
      <SettingsCard title="Data export" className="mb-4" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div data-testid="export-file-section">
          <Typography>Download your local data with your added Safe accounts, address book and settings.</Typography>

          {renderExportFileList({
            avatar: (
              <div className={`${css.fileIcon} rounded`}>
                <FileIcon className="size-4 fill-none" />
              </div>
            ),
            title: <b>{exportFileName}</b>,
            action: (
              <Track {...OVERVIEW_EVENTS.EXPORT_DATA} label={OVERVIEW_LABELS.settings}>
                <Button className="min-w-[unset] p-[var(--space-1)]" onClick={onExport}>
                  <ExportIcon className="size-4" />
                </Button>
              </Track>
            ),
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Data import" className="mb-4" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div>{importUpload}</div>

        {importDialog}
      </SettingsCard>

      <SettingsCard title="Pending transactions" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div data-testid="clear-pending-tx-section">{clearPendingTxs}</div>
      </SettingsCard>
    </>
  )
}
