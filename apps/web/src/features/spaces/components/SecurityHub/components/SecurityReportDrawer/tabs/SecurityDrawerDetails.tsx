import type { ReactElement } from 'react'
import Identicon from '@/components/common/Identicon'
import { useChain } from '@/hooks/useChains'
import { useLoadFeature } from '@/features/__core__'
import { SecurityFeature } from '@/features/security'
import type { ScanContext } from '@/features/security/types'
import { SecurityDrawerDetailsView } from '@views/features/spaces/components/SecurityHub/components/SecurityReportDrawer/tabs/SecurityDrawerDetailsView'

type SecurityDrawerDetailsProps = {
  scanContext: ScanContext | null
  /** Epoch ms of the last scan, surfaced as a relative "Last scanned" time. */
  lastScannedAt: number | null
}

const SecurityDrawerDetails = ({ scanContext, lastScannedAt }: SecurityDrawerDetailsProps): ReactElement | null => {
  const security = useLoadFeature(SecurityFeature)
  const chain = useChain(scanContext?.chainId ?? '')

  if (!scanContext) return null

  return (
    <SecurityDrawerDetailsView
      scanContext={scanContext}
      chainName={chain?.chainName}
      lastScanned={security.$isReady ? security.formatTimestamp(lastScannedAt ?? undefined) : undefined}
      renderIdenticon={(address) => <Identicon address={address} size={24} />}
    />
  )
}

export default SecurityDrawerDetails
