import type { ElementType, ReactElement } from 'react'
import { Box, SvgIcon, Tooltip, Typography } from '@mui/material'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import css from './styles.module.css'

type GroupMeta = {
  label: string
  hint: string
  icon: ElementType
}

export const getGroupMeta = (source: ContactSource, workspaceName?: string): GroupMeta => {
  switch (source) {
    case ContactSource.space:
      return {
        label: workspaceName ? `Contacts of ${workspaceName}` : 'Workspace contacts',
        hint: `Shared with everyone in ${workspaceName ?? 'your workspace'}. Only Workspace admins can add or change these contacts.`,
        icon: BusinessOutlinedIcon,
      }
    case ContactSource.private:
      return {
        label: 'Private contacts',
        hint: 'Visible only to you. Not shared with your workspace.',
        icon: CloudOutlinedIcon,
      }
    case ContactSource.local:
      return {
        label: 'Local contacts',
        hint: 'Saved only in this browser, from your old address book. Not shared with your workspace.',
        icon: ComputerOutlinedIcon,
      }
  }
}

const RecipientGroupHeader = ({
  source,
  workspaceName,
  count,
}: {
  source: ContactSource
  workspaceName?: string
  count: number
}): ReactElement => {
  const meta = getGroupMeta(source, workspaceName)

  return (
    <Box className={css.groupHeader} data-testid="contact-group-header">
      <SvgIcon component={meta.icon} inheritViewBox className={css.groupIcon} />

      <Typography variant="caption" fontWeight={700} noWrap>
        {meta.label}
      </Typography>

      <Tooltip title={meta.hint} placement="top">
        <SvgIcon component={InfoOutlinedIcon} inheritViewBox className={css.groupInfoIcon} />
      </Tooltip>

      <Typography variant="caption" color="text.secondary" className={css.groupCount}>
        {count}
      </Typography>
    </Box>
  )
}

export default RecipientGroupHeader
