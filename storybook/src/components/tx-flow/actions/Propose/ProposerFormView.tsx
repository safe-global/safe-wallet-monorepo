import type { ReactElement, ReactNode, SyntheticEvent } from 'react'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'

export type ProposerFormViewProps = {
  onSubmit: (e: SyntheticEvent) => void
  isRejectedByUser: boolean
  isSubmittable: boolean
  submitDisabled: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

export const ProposerFormView = ({
  onSubmit,
  isRejectedByUser,
  isSubmittable,
  submitDisabled,
  renderCheckWallet,
}: ProposerFormViewProps): ReactElement => {
  return (
    <form onSubmit={onSubmit}>
      <Typography>
        As a <strong>Proposer</strong>, you&apos;re creating this transaction without any signatures. It will need
        approval from a signer before it becomes a valid transaction.
      </Typography>

      {isRejectedByUser && (
        <div className="mt-2">
          <WalletRejectionError />
        </div>
      )}

      <div className="pt-6">
        <Separator bleed="6" />
      </div>

      <TxCardActions>
        {/* Submit button */}
        {renderCheckWallet((isOk) => (
          <Button
            data-testid="sign-btn"
            type="submit"
            size="submit"
            disabled={!isOk || submitDisabled}
            className="order-1"
          >
            {!isSubmittable ? <Spinner className="size-5" /> : 'Propose transaction'}
          </Button>
        ))}
      </TxCardActions>
    </form>
  )
}
