import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type NftsPageViewProps = {
  isFeatureEnabled?: boolean
  nftsPage: ReactNode
}

export const NftsPageView = ({ isFeatureEnabled, nftsPage }: NftsPageViewProps) => {
  return isFeatureEnabled === true ? (
    <main>{nftsPage}</main>
  ) : isFeatureEnabled === false ? (
    <main>
      <Typography align="center" className="my-6">
        NFTs are not available on this network.
      </Typography>
    </main>
  ) : null
}
