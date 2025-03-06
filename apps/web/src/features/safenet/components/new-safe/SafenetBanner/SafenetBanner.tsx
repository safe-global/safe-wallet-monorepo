import darkPalette from '@/components/theme/darkPalette'
import lightPalette from '@/components/theme/lightPalette'
import { AppRoutes } from '@/config/routes'
import { useDarkMode } from '@/hooks/useDarkMode'
import SafeLogoNoText from '@/public/images/logo-no-text-transparent.svg'
import SafenetLogo from '@/public/images/safenet/logo-safenet.svg'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Box, Button, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import css from './styles.module.css'

const SafenetBanner = () => {
  const router = useRouter()
  const isDarkMode = useDarkMode()
  const [displayBanner = true, setDisplayBanner] = useLocalStorage<boolean>('showSafenetBanner')

  const onClick = () => {
    router.push({
      pathname: AppRoutes.newSafe.safenetCreate,
    })
  }

  return (
    displayBanner && (
      <Grid className={isDarkMode ? css.darkBanner : css.lightBanner}>
        <SafeLogoNoText className={css.backgroundLogo} />
        <Typography
          variant="body2"
          color={isDarkMode ? lightPalette.text.primary : lightPalette.text.secondary}
          className={css.dismiss}
          onClick={() => setDisplayBanner(false)}
        >
          Dismiss
        </Typography>
        <Box className={css.title}>
          <Typography
            variant="h1"
            fontSize={28}
            color={isDarkMode ? lightPalette.text.primary : darkPalette.text.primary}
          >
            Unlock
          </Typography>
          <SafenetLogo height="24" className={css.safenetLogo} />
          <div className={css.newTag}>
            <Typography fontSize={12}>New</Typography>
          </div>
        </Box>
        <Typography
          maxWidth={500}
          color={isDarkMode ? lightPalette.text.primary : darkPalette.text.primary}
          fontSize={14}
        >
          Create a new account with Safenet to unlock a unified and secured experience across networks.
        </Typography>
        <Button size="small" onClick={onClick} className={css.bannerButton}>
          Get started
        </Button>
      </Grid>
    )
  )
}

export default SafenetBanner
