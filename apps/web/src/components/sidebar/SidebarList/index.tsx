import type { ReactElement } from 'react'
import List, { type ListProps } from '@mui/material/List'
import ListItemButton, { type ListItemButtonProps } from '@mui/material/ListItemButton'
import ListItemIcon, { type ListItemIconProps } from '@mui/material/ListItemIcon'
import ListItemText, { type ListItemTextProps } from '@mui/material/ListItemText'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'

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
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
    {...rest}
  >
    {children}
  </ListItemText>
)

export const SidebarListItemCounter = ({
  count,
  variant = 'warning',
}: {
  count?: string
  variant?: 'warning' | 'subtle'
}): ReactElement | null =>
  count ? (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: variant === 'warning' ? 'static.main' : 'text.primary',
        backgroundColor: variant === 'warning' ? 'warning.light' : 'background.main',
        border: variant === 'subtle' ? '1px solid' : undefined,
        borderColor: variant === 'subtle' ? 'background.main' : undefined,
        fontWeight: 700,
        fontSize: 11,
        lineHeight: '20px',
        minWidth: 20,
        px: 0.5,
        borderRadius: '10px',
        textAlign: 'center',
        ml: 3,
      }}
    >
      {count}
    </Box>
  ) : null
