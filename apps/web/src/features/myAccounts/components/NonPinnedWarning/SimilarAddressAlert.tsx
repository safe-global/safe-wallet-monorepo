import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
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
      <Alert variant="warning" className="mb-4">
        <AlertTitle>Similar address detected</AlertTitle>
        <AlertDescription>
          <p>
            This address is similar to another Safe in your account. This could indicate an address poisoning attack.
            Compare the addresses carefully before proceeding.
          </p>
          <p>
            <ExternalLink href={HelpCenterArticle.ADDRESS_POISONING} noIcon>
              Learn more about address poisoning
            </ExternalLink>
          </p>
        </AlertDescription>
      </Alert>

      {similarAddresses.length > 0 && (
        <div className="mb-4">
          <Typography variant="paragraph-small" color="muted" className="mb-2 block">
            Similar {similarAddresses.length === 1 ? 'Safe' : 'Safes'} in your account
          </Typography>
          {similarAddresses.map((similar) => (
            <div key={similar.address} className="bg-background border-border mb-2 rounded-md border p-4">
              <EthHashInfo address={similar.address} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
              {similar.name && (
                <Typography variant="paragraph-small" className="mt-2 block">
                  Name: {similar.name}
                </Typography>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default SimilarAddressAlert
