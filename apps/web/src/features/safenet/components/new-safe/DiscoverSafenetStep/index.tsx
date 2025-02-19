import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'
import { AppRoutes } from '@/config/routes'
import SafenetNetworkSelector from '@/features/safenet/components/SafenetNetworkSelector'
import CircleIcon from '@/public/images/safenet/circle.svg'
import GasTankIcon from '@/public/images/safenet/gas-tank.svg'
import RayIcon from '@/public/images/safenet/ray.svg'
import CheckIcon from '@mui/icons-material/Check'
import { Box, Button, Divider, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/router'
import css from './styles.module.css'

function DiscoverSafenetStep({ onSubmit }: StepRenderProps<NewSafeFormData>) {
  const router = useRouter()

  const onCancel = () => {
    router.push(AppRoutes.welcome.index)
  }

  const onContinueWithSafenet = () => {
    onSubmit({})
  }

  return (
    <>
      <Box className={css.row}>
        <Box className={css.content}>
          <Box className={css.cards}>
            <Box className={css.card}>
              <CheckIcon className={css.checkIcon} />
              <CircleIcon />
              <Typography variant="body2" fontWeight="bold">
                Unified balance
              </Typography>
              <Typography variant="body2">Unify your assets across networks and forget about bridging.</Typography>
            </Box>
            <Box className={css.card}>
              <CheckIcon className={css.checkIcon} />
              <RayIcon />
              <Typography variant="body2" fontWeight="bold">
                Instant transactions
              </Typography>
              <Typography variant="body2">
                No need to wait! With Safenet, cross-chain transactions are executed instantly.
              </Typography>
            </Box>
            <Box className={css.card}>
              <CheckIcon className={css.checkIcon} />
              <GasTankIcon />
              <Typography variant="body2" fontWeight="bold">
                Gas-Free
              </Typography>
              <Typography variant="body2">
                Enjoy sponsored transactions and never get stuck due to insufficient gas.
              </Typography>
            </Box>
          </Box>
          <Box className={css.networks}>
            <SafenetNetworkSelector displayLogo={false} expandable />
            <Typography variant="body2">Unsupported networks can be added later without Safenet.</Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <Box className={css.row}>
        <Box display="flex" flexDirection="row" justifyContent="space-between" gap={3}>
          <Button variant="text" onClick={onCancel} size="small">
            Back
          </Button>
          <Box display="flex" flexDirection="row" gap={1}>
            <Link href={AppRoutes.newSafe.create} passHref legacyBehavior>
              <Button type="button" variant="outlined">
                Skip Safenet
              </Button>
            </Link>
            <Button type="submit" onClick={onContinueWithSafenet} variant="contained">
              Create Account With Safenet
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default DiscoverSafenetStep
