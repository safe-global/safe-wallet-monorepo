import { Box, Typography } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import Button from '@mui/material/Button'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import Image from 'next/image'
import SkeletonBG from '@/public/images/spaces/skeleton_bg.png'

const UnauthorizedState = () => {
  return (
    <Box className={css.content}>
      <Box textAlign="center" className={css.contentInner}>
        <Image src={SkeletonBG} alt="" className={css.contentBg} />

        <Typography fontWeight={700} mb={2}>
          You don’t have permissions to this page
        </Typography>

        <Typography color="text.secondary" mb={2}>
          Sorry, you don’t have permissions to view this page, as your wallet is not a member of the space. Try to sign
          in with a different wallet or go back to the overview.
        </Typography>

        <Link href={AppRoutes.welcome.spaces} passHref>
          <Button variant="outlined">Back to overview</Button>
        </Link>
      </Box>
    </Box>
  )
}

export default UnauthorizedState
