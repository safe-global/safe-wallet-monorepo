import type { CSSProperties, ReactElement, ReactNode, SyntheticEvent } from 'react'

import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import ModalDialog from '@/components/common/ModalDialog'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export type ExportDialogViewProps = {
  length: number
  onClose: () => void
  onExport: (e: SyntheticEvent) => void
  renderDownloader: (props: { style: CSSProperties; children: ReactNode }) => ReactNode
}

export function ExportDialogView({ length, onClose, onExport, renderDownloader }: ExportDialogViewProps): ReactElement {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Export address book" hideChainIndicator>
      <div className="p-6">
        <Typography data-testid="export-summary">
          You&apos;re about to export a CSV file with{' '}
          <b>
            {length} address book {length === 1 ? 'entry' : 'entries'}
          </b>
          .
        </Typography>

        <Typography className="mt-2">
          <ExternalLink
            href={HelpCenterArticle.ADDRESS_BOOK_DATA}
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </ExternalLink>
        </Typography>
      </div>

      <div className="flex items-center justify-between gap-2 p-6 pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {renderDownloader({
          style: { order: 2 },
          children: (
            <Button data-testid="export-modal-btn" onClick={onExport}>
              Export
            </Button>
          ),
        })}
      </div>
    </ModalDialog>
  )
}
