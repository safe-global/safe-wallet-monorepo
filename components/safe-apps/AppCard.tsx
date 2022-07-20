import { ReactElement, SyntheticEvent } from 'react'
import { useRouter } from 'next/router'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { SafeAppData } from '@gnosis.pm/safe-react-gateway-sdk'
import { SAFE_REACT_URL } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import ShareIcon from '@/public/images/share.svg'
//import DeleteIcon from '@/public/images/delete.svg'

type AppCardProps = {
  safeApp: SafeAppData
}

const AppCard = ({ safeApp }: AppCardProps): ReactElement => {
  const router = useRouter()
  const chainId = useChainId()

  const shareUrl = `${SAFE_REACT_URL}/share/safe-app?appUrl=${safeApp.url}&chainId=${chainId}`

  const url = router.query.safe ? `${SAFE_REACT_URL}/${router.query.safe}/apps?appUrl=${safeApp.url}` : shareUrl

  const onShareClick = (e: SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <a href={url} target="_blank" rel="noreferrer">
      <Card
        sx={({ palette }) => ({
          maxWidth: 345,
          height: 190,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            backgroundColor: palette.primary.background,
            border: `2px solid ${palette.primary.light}`,
          },
        })}
      >
        <CardHeader
          avatar={
            <Avatar src={safeApp.iconUrl} alt={`${safeApp.name} logo`} variant="square" sx={{ objectFit: 'contain' }} />
          }
          action={
            <>
              <IconButton
                aria-label={`Share ${safeApp.name}`}
                size="small"
                onClick={onShareClick}
                title="Click to copy share URL"
              >
                <ShareIcon width={16} alt="Share icon" />
              </IconButton>
              {/* <IconButton aria-label={`Delete ${safeApp.name}`} size="small">
                <DeleteIcon width={16} alt="Delete icon" />
              </IconButton> */}
            </>
          }
        />

        <CardContent sx={{ paddingTop: 0 }}>
          <Typography gutterBottom variant="h5">
            {safeApp.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {safeApp.description}
          </Typography>
        </CardContent>
      </Card>
    </a>
  )
}

export { AppCard }
