import { type ReactElement } from 'react'
import { SvgIcon, Tooltip } from '@mui/material'
import SafeLogo from '@/public/images/logo-no-text.svg'
import css from './styles.module.css'

/**
 * A small badge marking an address that is itself a Safe account in the current workspace.
 * Used next to address book entries and recipient suggestions to highlight Safe-to-Safe transfers.
 */
const SafeTag = (): ReactElement => (
  <Tooltip title="This address is a Safe account in your workspace" placement="top">
    <span className={css.tag} data-testid="safe-tag">
      <SvgIcon component={SafeLogo} inheritViewBox className={css.icon} />
      Safe
    </span>
  </Tooltip>
)

export default SafeTag
