import type { ReactNode } from 'react'
import React, { useCallback, useRef, useState } from 'react'
import { Paper, Stack } from '@mui/material'
import { ToggleButtonGroup } from '@/components/common/ToggleButtonGroup'

type PaperViewToggleProps = {
  children: {
    title: ReactNode
    content: ReactNode
  }[]
  activeView?: number
  leftAlign?: boolean
}

export const PaperViewToggle = ({ children, leftAlign, activeView = 0 }: PaperViewToggleProps) => {
  const [active, setActive] = useState(activeView)
  // Intentionally using undefined to prevent rendering a 0px height on initial render
  const [minHeight, setMinHeight] = useState<number>()
  const stackRef = useRef<HTMLDivElement>(null)

  const onChangeView = useCallback(
    (index: number) => {
      // Avoid height change when switching between views
      setMinHeight((prev) => {
        if (!prev && stackRef.current) {
          return stackRef.current.offsetHeight
        }
        return prev
      })

      setActive(index)
    },
    [stackRef],
  )

  const Content = ({ index }: { index: number }) => children?.[index]?.content || null

  return (
    <Paper
      sx={{
        backgroundColor: 'background.main',
        pt: 1,
        pb: 1.5,
      }}
    >
      <Stack spacing={2} height={minHeight ? `${minHeight}px` : undefined} ref={stackRef}>
        <Stack direction={leftAlign ? 'row' : 'row-reverse'} justifyContent="space-between" px={2} py={1}>
          <ToggleButtonGroup onChange={onChangeView}>{children}</ToggleButtonGroup>
        </Stack>

        <Content index={active} />
      </Stack>
    </Paper>
  )
}
