import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import { Typography } from '@/components/ui/typography'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import {
  formatOutstandingSignatures,
  getOutstandingSignatures,
  type PolicyPendingState,
} from '../../utils/policyPendingState'
import type { PendingPolicy } from '../../types'

type PolicyPendingFooterProps = {
  policy: PendingPolicy
  state: PolicyPendingState
  transactionLink: string
  onSign?: () => void
  onExecute?: () => void
}

const PolicyPendingFooter = ({ policy, state, transactionLink, onSign, onExecute }: PolicyPendingFooterProps) => {
  const connectWallet = useConnectWallet()
  const [hasCopied, setHasCopied] = useState(false)

  const copyTransactionLink = async () => {
    await navigator.clipboard.writeText(transactionLink)
    setHasCopied(true)
  }

  if (state === 'unavailable') {
    return (
      <SheetFooter divided data-testid="policy-pending-footer">
        <Typography variant="paragraph-small" className="w-full text-center text-muted-foreground">
          This transaction can no longer be signed or executed. Set the policy up again to apply it.
        </Typography>
      </SheetFooter>
    )
  }

  if (state === 'not-signer') {
    return (
      <SheetFooter divided data-testid="policy-pending-footer">
        <Typography variant="paragraph-small" className="w-full text-center text-muted-foreground">
          Only signers of this Safe account can sign this transaction.
        </Typography>
      </SheetFooter>
    )
  }

  if (state === 'no-wallet') {
    return (
      <SheetFooter divided data-testid="policy-pending-footer">
        <Button onClick={connectWallet} className="w-full">
          Connect wallet
        </Button>
      </SheetFooter>
    )
  }

  if (state === 'fully-signed') {
    return (
      <SheetFooter divided data-testid="policy-pending-footer">
        <Button onClick={onExecute} className="w-full">
          Execute transaction
        </Button>
      </SheetFooter>
    )
  }

  if (state === 'signer-has-signed') {
    return (
      <SheetFooter divided data-testid="policy-pending-footer">
        <div className="flex w-full flex-col gap-2">
          <Typography variant="paragraph-small" className="text-center text-muted-foreground">
            You&apos;ve signed. Waiting for {formatOutstandingSignatures(getOutstandingSignatures(policy))}.
          </Typography>

          <Button onClick={copyTransactionLink} className="w-full">
            {hasCopied ? 'Link copied' : 'Copy transaction link'}
          </Button>
        </div>
      </SheetFooter>
    )
  }

  return (
    <SheetFooter divided data-testid="policy-pending-footer">
      <Button onClick={onSign} className="w-full">
        Sign transaction
      </Button>
    </SheetFooter>
  )
}

export default PolicyPendingFooter
