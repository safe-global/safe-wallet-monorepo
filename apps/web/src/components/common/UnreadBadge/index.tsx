import React from 'react'
import Badge, { type BadgeProps } from '@mui/material/Badge'

// Test change to trigger web Storybook screenshot workflow
const UnreadBadge = ({
  children,
  count,
  ...props
}: Pick<BadgeProps, 'children' | 'invisible' | 'anchorOrigin'> & { count?: number }) => (
  <Badge
    variant={count !== undefined ? 'standard' : 'dot'}
    badgeContent={count}
    color={count !== undefined ? 'secondary' : 'success'}
    {...props}
  >
    {children}
  </Badge>
)

export default UnreadBadge
