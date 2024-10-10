import { CircularProgress, Grid, Typography } from '@mui/material'
import React from 'react'
import css from './styles.module.css'

function ActivatingSuperAccount() {
  return (
    <Grid container gap={3} mb={2} flexWrap="nowrap" alignItems="center">
      <Grid item position="relative" display="inline-flex">
        <svg className={css.gradient}>
          <defs>
            <linearGradient
              id="progress_gradient"
              x1="21.1648"
              y1="8.21591"
              x2="-9.95028"
              y2="22.621"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FF0420" />
              <stop offset="1" stopColor="#d50018" />
            </linearGradient>
          </defs>
        </svg>
        <CircularProgress variant="determinate" value={100} className={css.circleBg} size={60} thickness={5} />
        <CircularProgress
          variant="indeterminate"
          value={3} // Just to give an indication of the progress even at 0%
          className={css.circleProgress}
          size={60}
          thickness={5}
          sx={{ 'svg circle': { stroke: 'url(#progress_gradient)', strokeLinecap: 'round' } }}
        />
      </Grid>
      <Grid item>
        <Typography component="div" variant="h2" fontWeight={700} mb={1}>
          Account is being activated...
        </Typography>

        <Typography variant="body2">
          <strong>This may take a few minutes.</strong> Once activated, your account will be up and running.
        </Typography>
      </Grid>
    </Grid>
  )
}

export default ActivatingSuperAccount
