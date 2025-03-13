import type { ReactElement } from 'react'
import { OpenInNewRounded } from '@mui/icons-material'
import { Box, Button, Link, type LinkProps } from '@mui/material'

/**
 * Renders an external Link which always sets the noopener and noreferrer rel attribute and the target to _blank.
 * It also always adds the external link icon as end adornment.
 */
const ExternalLink = ({
  noIcon = false,
  children,
  href,
  mode = 'link',
  ...props
}: Omit<LinkProps, 'target' | 'rel'> & { noIcon?: boolean; mode?: 'button' | 'link' }): ReactElement => {
  if (!href) return <>{children}</>

  const linkContent = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.2,
        cursor: 'pointer',
      }}
    >
      {children ?? href}
      {!noIcon && <OpenInNewRounded fontSize="small" />}
    </Box>
  )
  return mode === 'link' ? (
    <Link href={href} rel="noreferrer noopener" target="_blank" {...props}>
      {linkContent}
    </Link>
  ) : (
    <Button variant="outlined" href={href} rel="noreferrer noopener" target="_blank" sx={props.sx}>
      {linkContent}
    </Button>
  )
}

export default ExternalLink
