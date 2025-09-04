import { Paper, Typography, SvgIcon } from '@mui/material'
import type { PaperProps } from '@mui/material'
import type { AddressEx } from '@safe-global/safe-gateway-typescript-sdk'
import type { ReactElement } from 'react'

import PlusIcon from '@/public/images/common/plus.svg'
import EthHashInfo from '@/components/common/EthHashInfo'

import css from './styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export function OwnerList({
  title,
  icon,
  owners,
  sx,
}: {
  owners: Array<AddressEx>
  icon?: React.ElementType
  title?: string
  sx?: PaperProps['sx']
}): ReactElement {
  return (
    <Paper className={css.container} sx={sx}>
      <Typography
        sx={{
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          fontSize: 'inherit',
        }}
      >
        <SvgIcon component={icon ?? PlusIcon} inheritViewBox fontSize="small" sx={{ mr: 1 }} />
        {title ?? `Add owner${maybePlural(owners)}`}
      </Typography>
      {owners.map((newOwner) => (
        <EthHashInfo
          key={newOwner.value}
          address={newOwner.value}
          name={newOwner.name}
          shortAddress={false}
          showCopyButton
          hasExplorer
          avatarSize={32}
        />
      ))}
    </Paper>
  )
}
