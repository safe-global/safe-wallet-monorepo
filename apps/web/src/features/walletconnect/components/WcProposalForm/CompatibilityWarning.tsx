import type { WalletKitTypes } from '@reown/walletkit'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import ChainIndicator from '@/components/common/ChainIndicator'
import { useCompatibilityWarning, type CompatibilityWarningSeverity } from './useCompatibilityWarning'
import useSafeInfo from '@/hooks/useSafeInfo'

import css from './styles.module.css'

const SEVERITY_TO_VARIANT: Record<CompatibilityWarningSeverity, 'default' | 'destructive' | 'warning'> = {
  error: 'destructive',
  warning: 'warning',
  info: 'default',
}

export const CompatibilityWarning = ({
  proposal,
  chainIds,
}: {
  proposal: WalletKitTypes.SessionProposal
  chainIds: Array<string>
}) => {
  const { safe } = useSafeInfo()
  const isUnsupportedChain = !chainIds.includes(safe.chainId)
  const { severity, message } = useCompatibilityWarning(proposal, isUnsupportedChain)

  return (
    <>
      <Alert variant={SEVERITY_TO_VARIANT[severity]} className={css.alert}>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {isUnsupportedChain && (
        <>
          <Typography variant="h4" className="mt-6 mb-2">
            Supported networks
          </Typography>

          <div className={`flex flex-row ${css.chainContainer}`}>
            {chainIds.map((chainId) => (
              <ChainIndicator inline chainId={chainId} key={chainId} className={css.chain} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
