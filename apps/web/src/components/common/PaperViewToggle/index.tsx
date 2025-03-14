import { ToggleButtonGroup } from '@/components/common/ToggleButtonGroup'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { isString } from 'lodash'
import type { ReactElement } from 'react'
import React, { useState } from 'react'

type PaperViewToggleProps = {
  children: {
    icon: ReactElement
    tooltip?: string
    content: ReactElement
    title?: string | ReactElement
  }[]
  activeView?: number
}

export const PaperViewToggle = ({ children, activeView = 0 }: PaperViewToggleProps) => {
  const [active, setActive] = useState(activeView)

  const onChangeView = (index: number) => {
    setActive(index)
  }

  const Title = ({ index }: { index: number }) => {
    const { title } = children?.[index] || {}
    return isString(title) ? <Typography color="text.secondary">{title}</Typography> : title
  }

  const Content = ({ index }: { index: number }) => children?.[index]?.content || null

  return (
    <Paper sx={{ backgroundColor: 'background.main', py: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row-reverse" justifyContent="space-between" px={2}>
          <ToggleButtonGroup onChange={onChangeView}>{children}</ToggleButtonGroup>
          <Title index={active} />
        </Stack>

        <Box>
          <Content index={active} />
        </Box>
      </Stack>
    </Paper>
  )
}
