import type { ReactElement } from 'react'
import List, { type ListProps } from '@mui/material/List'
import ListItemButton, { type ListItemButtonProps } from '@mui/material/ListItemButton'
import ListItemIcon, { type ListItemIconProps } from '@mui/material/ListItemIcon'
import ListItemText, { type ListItemTextProps } from '@mui/material/ListItemText'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import Badge from '@mui/material/Badge'

import css from './styles.module.css'

export const SidebarList = ({ children, ...rest }: Omit<ListProps, 'className'>): ReactElement => (
  <List className={css.list} {...rest}>
    {children}
  </List>
)

export const SidebarListItemButton = ({
  href,
  children,
  disabled,
  ...rest
}: Omit<ListItemButtonProps, 'sx'> & { href?: LinkProps['href'] }): ReactElement => {
  const button = (
    <ListItemButton className={css.listItemButton} {...rest} sx={disabled ? { pointerEvents: 'none' } : undefined}>
      {children}
    </ListItemButton>
  )

  return href ? (
    <Link href={href} passHref legacyBehavior>
      {button}
    </Link>
  ) : (
    button
  )
}

export const SidebarListItemIcon = ({
  children,
  badge = false,
  ...rest
}: Omit<ListItemIconProps, 'className'> & { badge?: boolean }): ReactElement => (
  <ListItemIcon
    className={css.icon}
    sx={{
      '& svg': {
        width: '16px',
        height: '16px',
        '& path': ({ palette }) => ({
          fill: palette.logo.main,
        }),
      },
    }}
    {...rest}
  >
    <Badge color="error" variant="dot" invisible={!badge} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      {children}
    </Badge>
  </ListItemIcon>
)

export const SidebarListItemText = ({
  children,
  bold = false,
  ...rest
}: ListItemTextProps & { bold?: boolean }): ReactElement => (
  <ListItemText
    primaryTypographyProps={{
      variant: 'body2',
      fontWeight: bold ? 700 : undefined,
      display: 'flex',
      justifyContent: 'space-between',
    }}
    {...rest}
  >
    {children}
  </ListItemText>
)

export const SidebarListItemCounter = ({ count }: { count?: string }): ReactElement | null =>
  count ? (
    <Badge
      sx={{
        '& .MuiBadge-badge': {
          color: 'static.main',
          backgroundColor: 'warning.light',
          transform: 'none',
          fontWeight: 'bold',
          padding: '0 4px',
          fontSize: '11px',
        },
        ml: 3,
      }}
      variant="standard"
      badgeContent={count}
    />
  ) : null
