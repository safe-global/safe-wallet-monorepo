import OrgsIcon from '@/public/images/orgs/orgs.svg'
import { Card, Link, Typography } from '@mui/material'

const InfoModal = () => {
  const openInfoModal = () => {
    // TODO: implement
  }

  return (
    <Link onClick={openInfoModal} href="#">
      What are team members?
    </Link>
  )
}

const EmptyMembers = () => {
  return (
    <Card sx={{ p: 5, textAlign: 'center' }}>
      <OrgsIcon />

      <Typography color="text.secondary" mb={2}>
        Your haven&apos;t invited any team members yet.
        <br />
        <InfoModal />
      </Typography>
    </Card>
  )
}

export default EmptyMembers
