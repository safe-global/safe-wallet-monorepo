import { Box, Typography } from '@mui/material'
import React, { ReactNode } from 'react'
import css from './styles.module.css'

function SafeAppPerks({ content }: { content?: string | ReactNode }) {
  return (
    <Box>
      <div className={css.currentLevelTitle}>
        <Typography fontWeight={600} fontSize={14} color="white">
          Current Level Perk
        </Typography>
      </div>
      <div className={css.currentLevelInfo}>
        <Typography>{content || 'No active benefits'}</Typography>
      </div>
    </Box>
  )
}

export default SafeAppPerks
