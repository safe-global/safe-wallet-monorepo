import type { ReactNode } from 'react'
import React, { type ReactElement, type SyntheticEvent, useCallback, useState } from 'react'
import CopyIcon from '@/public/images/common/copy.svg'
import { IconButton, SvgIcon, Tooltip, Typography } from '@mui/material'

const CopyButton = ({
  text,
  className,
  children,
  initialToolTipText = 'Copy to clipboard',
  onCopy,
}: {
  text: string
  className?: string
  children?: ReactNode
  initialToolTipText?: string
  ariaLabel?: string
  onCopy?: () => void
}): ReactElement => {
  const [tooltipText, setTooltipText] = useState(initialToolTipText)

  const handleCopy = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      e.stopPropagation()
      navigator.clipboard.writeText(text).then(() => setTooltipText('Copied'))
      onCopy?.()
    },
    [text, onCopy],
  )

  const handleMouseLeave = useCallback(() => {
    setTimeout(() => setTooltipText(initialToolTipText), 500)
  }, [initialToolTipText])

  return (
    <Tooltip title={tooltipText} placement="top" onMouseLeave={handleMouseLeave}>
      <IconButton aria-label={initialToolTipText} onClick={handleCopy} size="small" className={className}>
        {children ?? (
          <>
            <SvgIcon
              component={CopyIcon}
              inheritViewBox
              color="primary"
              sx={{
                '& path': {
                  fill: ({ palette }) => palette.border.main,
                },
              }}
              fontSize="small"
            />
            <Typography style={{ fontSize: '10px' }}>Copy</Typography>
          </>
        )}
      </IconButton>
    </Tooltip>
  )
}

export default CopyButton
