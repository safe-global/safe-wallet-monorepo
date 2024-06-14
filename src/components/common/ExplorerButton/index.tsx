import type { ReactElement, ComponentType, SyntheticEvent } from 'react'
import { IconButton, SvgIcon, Tooltip } from '@mui/material'
import LinkIcon from '@/public/images/common/link.svg'

export type ExplorerButtonProps = {
  title?: string
  href?: string
  className?: string
  icon?: ComponentType
  onClick?: (e: SyntheticEvent) => void
  fontSize?: 'small' | 'inherit'
  color?: 'default' | 'inherit' | 'primary' | 'secondary'
}

const ExplorerButton = ({
  title = '',
  href = '',
  icon = LinkIcon,
  className,
  onClick,
  fontSize = 'small',
  color = 'default',
}: ExplorerButtonProps): ReactElement => (
  <Tooltip title={title} placement="top">
    <IconButton
      data-testid="explorer-btn"
      className={className}
      target="_blank"
      rel="noreferrer"
      href={href}
      size="small"
      sx={{ color: 'inherit' }}
      onClick={onClick}
      color={color}
    >
      <SvgIcon component={icon} inheritViewBox fontSize={fontSize} />
    </IconButton>
  </Tooltip>
)

export default ExplorerButton
