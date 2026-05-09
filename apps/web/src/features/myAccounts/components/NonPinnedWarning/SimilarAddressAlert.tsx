import { Alert, Typography, Box } from '@mui/material'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type { SimilarAddressInfo } from '../../hooks/useNonPinnedSafeWarning.types'

interface SimilarAddressAlertProps {
  similarAddresses: SimilarAddressInfo[]
}

const SimilarAddressAlert = ({ similarAddresses }: SimilarAddressAlertProps) => {
  return (
    <>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          Similar address detected
        </Typography>
        <Typography variant="body2">
          This address is similar to another Safe in your account. This could indicate an address poisoning attack.
          Compare the addresses carefully before proceeding.{' '}
        </Typography>
        <Typography variant="body2">
          <ExternalLink href={HelpCenterArticle.ADDRESS_POISONING} noIcon>
            Learn more about address poisoning
          </ExternalLink>
        </Typography>
      </Alert>

      {similarAddresses.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Similar {similarAddresses.length === 1 ? 'Safe' : 'Safes'} in your account
          </Typography>
          {similarAddresses.map((similar) => (
            <Box
              key={similar.address}
              sx={{
                p: 2,
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'border.light',
              }}
            >
              <EthHashInfo address={similar.address} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
              {similar.name && (
                <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                  Name: {similar.name}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  )
}

export default SimilarAddressAlert
