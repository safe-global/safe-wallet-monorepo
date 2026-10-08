import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { RenderChainIndicator } from '@views/features/multichain/components/NetworkLogosList/NetworkLogosListView'

export type ChainIndicatorListViewProps = {
  chains: { chainId: string; chainName?: string }[]
  renderChainIndicator: RenderChainIndicator
}

// Displays a list of chains with their logos and names
export const ChainIndicatorListView = ({ chains, renderChainIndicator }: ChainIndicatorListViewProps) => {
  return (
    <>
      {chains.map(({ chainId, chainName }, index) => {
        return (
          <div key={chainId} className="relative top-[5px] inline-flex flex-wrap">
            {renderChainIndicator({ responsive: true, chainId, showUnknown: false, onlyLogo: true })}
            <Typography className="relative top-[2px] mx-1">
              {chainName}
              {index === chains.length - 1 ? '.' : ','}
            </Typography>
          </div>
        )
      })}
    </>
  )
}

export type InconsistentSignerSetupWarningViewProps = {
  onReviewSigners: () => void
}

export const InconsistentSignerSetupWarningView = ({ onReviewSigners }: InconsistentSignerSetupWarningViewProps) => {
  return (
    <Alert variant="warning" outlined={false}>
      <AlertSeverityIcon variant="warning" />
      <AlertTitle className="font-bold">You have different signers across different networks.</AlertTitle>
      <AlertDescription>
        This could break approvals and you may risk losing control of this Safe. First, switch to the affected network
        and review the signer setup for this Safe.
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="text-foreground"
            data-testid="review-signers-btn"
            onClick={onReviewSigners}
          >
            Review signers
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
