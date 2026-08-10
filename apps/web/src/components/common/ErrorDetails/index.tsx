import type { ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import css from './styles.module.css'

/**
 * NOTE: This component intentionally uses MUI, not shadcn/ui.
 *
 * It renders inside the MUI `ErrorMessage` component, and mounting a shadcn
 * `Alert` there (which needs its own `.shadcn-scope` + scoped Tailwind preflight)
 * conflicts with `ErrorMessage`'s MUI styling. `ErrorMessage` is owned/changed by
 * another workstream, so we keep this MUI for now. Migrate this to shadcn once the
 * app-wide shadcn migration lands and `ErrorMessage` is shadcn.
 */

/**
 * Support reference for an on-chain (GS) error's "Details" panel. Per product
 * (WA-3005), this deliberately shows only the error code — the full support
 * reference (tx hash, network, timestamp) is meant to live in the support tool,
 * not be copy-pasted by users. Never renders the raw error payload.
 */
const ErrorDetails = ({ code }: { code: string }): ReactElement => {
  return (
    <Box className={css.container} data-testid="error-details">
      <Typography variant="body2" component="span" className={css.label}>
        Error code
      </Typography>{' '}
      <Typography variant="body2" component="span" className={css.value}>
        {code}
      </Typography>
    </Box>
  )
}

export default ErrorDetails
