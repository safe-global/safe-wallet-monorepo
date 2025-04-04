import type { ReactNode } from 'react'
import React, { useState } from 'react'
import { Paper, Stack } from '@mui/material'
import { ToggleButtonGroup } from '@/components/common/ToggleButtonGroup'

type PaperViewToggleProps = {
  children: {
    title: ReactNode
    content: ReactNode
  }[]
  activeView?: number
  withBackground?: boolean
}

export const PaperViewToggle = ({ children, withBackground, activeView = 0 }: PaperViewToggleProps) => {
  const [active, setActive] = useState(activeView)

  const onChangeView = (index: number) => {
    setActive(index)
  }

  const Content = ({ index }: { index: number }) => children?.[index]?.content || null

  return (
    <Paper
      sx={{
        backgroundColor: withBackground ? 'background.main' : undefined,
        py: 2,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row-reverse" justifyContent="space-between" px={2}>
          <ToggleButtonGroup onChange={onChangeView} withBackground={withBackground}>
            {children}
          </ToggleButtonGroup>
        </Stack>

        <Content index={active} />
      </Stack>
    </Paper>
  )
}
