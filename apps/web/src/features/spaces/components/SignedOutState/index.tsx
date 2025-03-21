import { Box, Typography } from '@mui/material'
import css from '@/features/spaces/components/Dashboard/styles.module.css'
import SignInButton from '@/features/spaces/components/SignInButton'
import SkeletonBG from '@/public/images/spaces/skeleton_bg.png'
import Image from 'next/image'

const SignedOutState = () => {
  return (
    <Box className={css.content}>
      <Box textAlign="center" className={css.contentInner}>
        <Image src={SkeletonBG} alt="" className={css.contentBg} />

        <Typography fontWeight={700} mb={2}>
          Sign in to see content
        </Typography>

        <Typography color="text.secondary" mb={2}>
          To view and interact with spaces, you need to sign in with the wallet, that is a member of the space. Sign in
          to continue.
        </Typography>

        <SignInButton />
      </Box>
    </Box>
  )
}

export default SignedOutState
