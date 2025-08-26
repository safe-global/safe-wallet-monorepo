import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { Button, Paper, Typography } from '@mui/material'
import DefiImage from '@/public/images/balances/defi.png'
import { AppRoutes } from '@/config/routes'

const PositionsEmpty = () => {
  const router = useRouter()

  return (
    <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
      <Image src={DefiImage} alt="Defi illustration" width={100} height={100} />

      <Typography data-testid="no-tx-text" variant="body1" color="primary.light">
        You have no active DeFi positions yet
      </Typography>

      <Link href={AppRoutes.earn && { pathname: AppRoutes.earn, query: { safe: router.query.safe } }} passHref>
        <Button size="small" sx={{ mt: 1 }}>
          Explore Earn
        </Button>
      </Link>
    </Paper>
  )
}

export default PositionsEmpty
