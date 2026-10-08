import type { ReactElement, ReactNode } from 'react'

import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

import css from './styles.module.css'

export type ImportSummaryViewProps = {
  entryCount: number
  chainCount: number
}

export function ImportSummaryView({ entryCount, chainCount }: ImportSummaryViewProps): ReactElement {
  return (
    <Typography data-testid="summary-message">
      {`Found ${entryCount} entries on ${chainCount} ${chainCount > 1 ? 'chains' : 'chain'}`}
    </Typography>
  )
}

export type ImportDialogViewProps = {
  brandName: string
  uploader: ReactNode
  errorMessage?: ReactNode
  importDisabled: boolean
  onClose: () => void
  onImport: () => void
}

export function ImportDialogView({
  brandName,
  uploader,
  errorMessage,
  importDisabled,
  onClose,
  onImport,
}: ImportDialogViewProps): ReactElement {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Import address book" hideChainIndicator>
      <div className="px-6 py-5">
        {uploader}

        <div className={css.horizontalDivider} />

        {errorMessage}

        <Typography>
          Only CSV files exported from a {brandName} can be imported.
          <br />
          <ExternalLink
            href={HelpCenterArticle.ADDRESS_BOOK_DATA}
            title="Learn about the address book import and export"
          >
            Learn about the address book import and export
          </ExternalLink>
        </Typography>
      </div>
      <DialogActions
        className="p-6 pt-2"
        onCancel={onClose}
        cancelTestId="cancel-btn"
        confirmLabel="Import"
        onConfirm={onImport}
        confirmDisabled={importDisabled}
        confirmTestId="import-btn"
      />
    </ModalDialog>
  )
}
