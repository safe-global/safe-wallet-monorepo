import type { ReactElement } from 'react'
import { Grid, Button, Typography } from '@mui/material'
import { styles } from './constants'

const CookieBannerActions = ({
  onAccept,
  onAcceptAll,
}: {
  onAccept: () => void
  onAcceptAll: () => void
}): ReactElement => {
  return (
    <Grid container sx={styles.buttonsGrid}>
      <Grid item>
        <Typography>
          <Button onClick={onAccept} variant="text" size="small" color="inherit" disableElevation>
            Save settings
          </Button>
        </Typography>
      </Grid>

      <Grid item>
        <Button onClick={onAcceptAll} variant="contained" color="secondary" size="small" disableElevation>
          Accept all
        </Button>
      </Grid>
    </Grid>
  )
}

export default CookieBannerActions
