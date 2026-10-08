import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import { useEffect } from 'react'

const SAMPLE_DAPPS = [
  { name: 'Zerion', icon: '/images/common/nft-zerion.svg', url: 'https://app.zerion.io/connect-wallet' },
  { name: 'Zapper', icon: '/images/common/nft-zapper.svg', url: 'https://zapper.xyz/' },
  { name: 'OpenSea', icon: '/images/common/nft-opensea.svg', url: 'https://opensea.io/' },
]

const WcSampleDapps = ({ onUnload }: { onUnload: () => void }) => {
  // Only show the sample dApps list once
  useEffect(() => {
    return onUnload
  }, [onUnload])

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      {SAMPLE_DAPPS.map((item) => (
        <Typography variant="paragraph-small" key={item.url}>
          <ExternalLink href={item.url} noIcon className="px-2">
            <img src={item.icon} alt={item.name} width={32} height={32} style={{ marginRight: '0.5em' }} />
            {item.name}
          </ExternalLink>
        </Typography>
      ))}
    </div>
  )
}

export type WcNoSessionsViewProps = {
  showSampleDapps: boolean
  onUnload: () => void
}

export const WcNoSessionsView = ({ showSampleDapps, onUnload }: WcNoSessionsViewProps) => {
  const sampleDapps = showSampleDapps && <WcSampleDapps onUnload={onUnload} />

  return (
    <>
      <Typography variant="paragraph-small" align="center" className="text-muted-foreground">
        No dApps are connected yet.{sampleDapps ? ' Try one of these:' : ''}
      </Typography>

      {sampleDapps}
    </>
  )
}
