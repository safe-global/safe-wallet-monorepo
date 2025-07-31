import { Box, Button, Card, IconButton, Link, Stack, SvgIcon, Typography } from '@mui/material'
import Image from 'next/image'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import Track from '@/components/common/Track'
import { MOBILE_APP_EVENTS } from '@/services/analytics/events/mobile-app'
import MobileAppIllustration from '@/public/images/common/mobile-app-illustration.png'
import AppleIcon from '@/public/images/common/apple-icon.svg'
import AndroidIcon from '@/public/images/common/android-icon.svg'
import { IOS_APP_STORE_URL, ANDROID_PLAY_STORE_URL } from '@safe-global/utils/config/constants'

export const signOnTheGoBannerID = 'signOnTheGoBanner'

const SignOnTheGoBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <Card className={css.banner}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Image
          className={css.bannerImage}
          src={MobileAppIllustration}
          alt="Safe Mobile app illustration"
          width={100}
          height={100}
        />
        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold" color="static.main" className={css.bannerText}>
            Sign on the go. Your Safe is now mobile.
          </Typography>

          <Typography variant="body2" color="static.light" className={css.bannerText} sx={{ mb: 2 }}>
            Sign transactions instantly, wherever you are. The all-new Safe{'{Mobile}'} app is here
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Track {...MOBILE_APP_EVENTS.DOWNLOAD_IOS}>
              <Link href={IOS_APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="contained"
                  size="small"
                  sx={(theme) => ({
                    backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'text.primary',
                    color: theme.palette.mode === 'dark' ? 'text.primary' : 'background.paper',
                  })}
                  startIcon={
                    <SvgIcon component={AppleIcon} inheritViewBox fontSize="small" alt="Apple" width={16} height={16} />
                  }
                >
                  Download on iOS
                </Button>
              </Link>
            </Track>

            <Track {...MOBILE_APP_EVENTS.DOWNLOAD_ANDROID}>
              <Link href={ANDROID_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="contained"
                  size="small"
                  sx={(theme) => ({
                    backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'text.primary',
                    color: theme.palette.mode === 'dark' ? 'text.primary' : 'background.paper',
                  })}
                  startIcon={
                    <SvgIcon
                      component={AndroidIcon}
                      inheritViewBox
                      fontSize="small"
                      alt="Android"
                      width={16}
                      height={16}
                    />
                  }
                >
                  Download on Android
                </Button>
              </Link>
            </Track>
          </Stack>
        </Box>
      </Stack>

      <Track {...MOBILE_APP_EVENTS.HIDE_BANNER}>
        <IconButton className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon fontSize="small" color="border" />
        </IconButton>
      </Track>
    </Card>
  )
}

export default SignOnTheGoBanner
