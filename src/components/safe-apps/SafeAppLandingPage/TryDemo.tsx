import { Box, Button, Typography } from '@mui/material'
import { CTA_HEIGHT, CTA_BUTTON_WIDTH } from '@/components/safe-apps/SafeAppLandingPage/constants'

type Props = {
  demoUrl: string
  onClick(): void
}

const TryDemo = ({ demoUrl, onClick }: Props) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="space-between" height={CTA_HEIGHT}>
    <Typography variant="h5" fontWeight={700}>
      Try the app before using it
    </Typography>
    <img src="/images/apps-demo.svg" alt="An icon of a internet browser" />
    <Button href={demoUrl} variant="outlined" sx={{ width: CTA_BUTTON_WIDTH }} onClick={onClick}>
      Try demo
    </Button>
  </Box>
)

export { TryDemo }
