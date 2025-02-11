import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { Button, Paper, Stack } from '@mui/material'
import SafeAppIconCard from '../SafeAppIconCard'
import css from './styles.module.css'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'

const SWAPS_APP_CARD_STORAGE_KEY = 'showSwapsAppCard'

const NativeSwapsCard = () => {
  const router = useRouter()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const [isSwapsCardVisible = true, setIsSwapsCardVisible] = useLocalStorage<boolean>(SWAPS_APP_CARD_STORAGE_KEY)
  if (!isSwapFeatureEnabled || !isSwapsCardVisible) return null

  return (
    <Paper className={css.container}>
      <CardHeader
        className={css.header}
        avatar={
          <div className={css.iconContainer}>
            <SafeAppIconCard src="/images/common/swap.svg" alt="Swap Icon" width={24} height={24} />
          </div>
        }
      />
      <CardContent className={css.content}>
        <Typography className={css.title} variant="h5">
          Native swaps are here!
        </Typography>

        <Typography
          className={css.description}
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Experience seamless trading with better decoding and security in native swaps.
        </Typography>

        <Stack
          direction="row"
          className={css.buttons}
          sx={{
            gap: 2,
          }}
        >
          <Track {...SWAP_EVENTS.OPEN_SWAPS} label={SWAP_LABELS.safeAppsPromoWidget}>
            <Link href={{ pathname: AppRoutes.swap, query: { safe: router.query.safe } }} passHref legacyBehavior>
              <Button variant="contained" size="small">
                Try now
              </Button>
            </Link>
          </Track>
          <Button onClick={() => setIsSwapsCardVisible(false)} size="small" variant="text" sx={{ px: '16px' }}>
            Don&apos;t show
          </Button>
        </Stack>
      </CardContent>
    </Paper>
  )
}

export default NativeSwapsCard
