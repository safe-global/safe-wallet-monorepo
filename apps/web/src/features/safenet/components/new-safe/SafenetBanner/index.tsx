import darkPalette from '@/components/theme/darkPalette'
import lightPalette from '@/components/theme/lightPalette'
import { AppRoutes } from '@/config/routes'
import SafeLogoNoText from '@/public/images/logo-no-text-transparent.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import { Box, Button, Grid, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useState } from 'react'
import css from './styles.module.css'

const SafenetBanner = () => {
  const router = useRouter()
  const { palette } = useTheme()
  const [displayBanner, setDisplayBanner] = useState<boolean>(true)

  const onClick = () => {
    router.push({
      pathname: AppRoutes.newSafe.safenetCreate,
    })
  }

  return (
    displayBanner && (
      <Grid className={palette.mode === 'dark' ? css.darkBanner : css.lightBanner}>
        <SafeLogoNoText className={css.backgroundLogo} />
        <Typography
          variant="body2"
          color={lightPalette.text.secondary}
          className={css.dismiss}
          onClick={() => setDisplayBanner(false)}
        >
          Dismiss
        </Typography>
        <Box className={css.title}>
          <Typography
            variant="h1"
            sx={{
              fontSize: 28,
              color: darkPalette.text.primary,
            }}
          >
            Enter
          </Typography>
          <SafenetLogo height="24" />
          <div className={css.newTag}>
            <Typography fontSize={12}>New</Typography>
          </div>
        </Box>
        <Typography color={darkPalette.text.primary} fontSize={14}>
          Create a new account with Safenet to unlock a unified and secured experience across networks.
        </Typography>
        <Button
          onClick={onClick}
          className={css.bannerButton}
          sx={{
            color: lightPalette.text.primary,
          }}
        >
          Learn more
        </Button>
      </Grid>
    )
  )
}

export default SafenetBanner
