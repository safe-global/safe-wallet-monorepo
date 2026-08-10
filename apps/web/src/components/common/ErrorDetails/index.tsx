import type { ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import { type SupportReference, formatSupportReference } from '@safe-global/utils/services/exceptions/supportReference'
import CopyButton from '@/components/common/CopyButton'
import css from './styles.module.css'

/**
 * NOTE: This component intentionally uses MUI, not shadcn/ui.
 *
 * It renders inside the MUI `ErrorMessage` component, and mounting a shadcn
 * `Alert` there (which needs its own `.shadcn-scope` + scoped Tailwind preflight)
 * conflicts with `ErrorMessage`'s MUI styling. `ErrorMessage` is owned/changed by
 * another workstream, so we keep this MUI for now. Migrate this to the shadcn
 * `Alert` once the app-wide shadcn migration lands and `ErrorMessage` is shadcn.
 */

const shortenHash = (hash: string): string => (hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash)

const Row = ({ label, value }: { label: string; value: string }) => (
  <Box className={css.row}>
    <Typography variant="body2" color="text.secondary" component="span" className={css.label}>
      {label}
    </Typography>
    <Typography variant="body2" component="span" className={css.value}>
      {value}
    </Typography>
  </Box>
)

/**
 * Support reference shown in an error's "Details" panel: error code, tx hash,
 * network, timestamp, and a copy button — nothing else. Never renders the raw
 * error payload (WA-3005 AC: no provider URL, request body, or library version).
 */
const ErrorDetails = ({ reference }: { reference: SupportReference }): ReactElement => {
  return (
    <Box className={css.container} data-testid="error-details">
      <Box className={css.header}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          Support reference
        </Typography>
        <CopyButton text={formatSupportReference(reference)} initialToolTipText="Copy support reference" />
      </Box>

      <Row label="Error code" value={reference.code} />
      {reference.txHash && <Row label="Transaction" value={shortenHash(reference.txHash)} />}
      {reference.network && <Row label="Network" value={reference.network} />}
      <Row label="Time" value={new Date(reference.timestamp).toLocaleString()} />
    </Box>
  )
}

export default ErrorDetails
