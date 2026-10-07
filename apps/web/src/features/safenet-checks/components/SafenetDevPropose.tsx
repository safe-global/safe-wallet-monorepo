import { useState, type ReactElement } from 'react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SAFENET_CHAIN_ID, type SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import ExternalLink from '@/components/common/ExternalLink'
import { Button } from '@/components/ui/button'
import { useChain } from '@/hooks/useChains'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import { assertWalletChain, getAssertedChainSigner } from '@/services/tx/tx-sender/sdk'
import { proposeSafenetCheck, type ProposeStep } from '../proposeSafenetCheck'
import { ruleLabel, sentinelVotes, type SentinelVote } from '../sentinelVotes'

type Step = 'switching' | ProposeStep

const STEP_LABEL: Record<Step, string> = {
  switching: 'Switching to Gnosis Chain…',
  approving: 'Approving the check fee…',
  proposing: 'Proposing the check…',
}

const VOTE_LABEL: Record<SentinelVote['vote'], string> = {
  committed: 'committed, not revealed',
  approved: 'approve',
  denied: 'deny',
}

export type SafenetDevProposeProps = {
  txDetails: TransactionDetails
  /** The Safe's home chain id. */
  chainId: string
  /** Called after the proposal is mined, so the Safenet step can re-read the check. */
  onProposed?: () => void
  /** The check read for this transaction; its sentinel votes are listed. */
  snapshot?: SafenetCheckSnapshot
}

/**
 * Dev-only control: the connected wallet proposes a Safenet check for this transaction on Gnosis
 * Chain and pays the Oracle fee. Below it, each sentinel's vote and reason on the active request.
 * Production builds never load it (see `feature.tsx`).
 */
export const SafenetDevPropose = ({
  txDetails,
  chainId,
  onProposed,
  snapshot,
}: SafenetDevProposeProps): ReactElement => {
  const onboard = useOnboard()
  const wallet = useWallet()
  const safenetChain = useChain(SAFENET_CHAIN_ID)
  const [step, setStep] = useState<Step>()
  const [proposalHash, setProposalHash] = useState<string>()
  const [error, setError] = useState<string>()

  const propose = async () => {
    if (!onboard) return
    setError(undefined)
    setProposalHash(undefined)
    try {
      setStep('switching')
      const connected = await assertWalletChain(onboard, SAFENET_CHAIN_ID)
      const signer = await getAssertedChainSigner(connected.provider)
      setProposalHash(await proposeSafenetCheck({ signer, txDetails, chainId, onStep: setStep }))
      onProposed?.()
    } catch (e) {
      setError(asError(e).message)
    } finally {
      setStep(undefined)
    }
  }

  const proposalLink =
    proposalHash && safenetChain ? getExplorerLink(proposalHash, safenetChain.blockExplorerUriTemplate) : undefined
  const votes = sentinelVotes(snapshot)

  return (
    <div className="mt-4 flex flex-col items-start gap-2" data-testid="safenet-dev-propose">
      <Button variant="outline" size="xs" disabled={!wallet || !!step} onClick={propose}>
        {step ? STEP_LABEL[step] : 'Propose Safenet check (dev)'}
      </Button>
      {!wallet && (
        <p className="text-xs text-muted-foreground">Connect a wallet that holds the check fee on Gnosis Chain.</p>
      )}
      {proposalLink && (
        <ExternalLink href={proposalLink.href} className="text-xs">
          Proposal transaction
        </ExternalLink>
      )}
      {error && <p className="text-xs text-destructive break-all">{error}</p>}
      {votes.length > 0 && (
        <ul className="text-xs text-muted-foreground" data-testid="safenet-dev-votes">
          {votes.map(({ sentinel, vote, reason }) => (
            <li key={sentinel}>
              {shortenAddress(sentinel)}: {VOTE_LABEL[vote]}
              {reason ? ` · ${ruleLabel(reason)}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SafenetDevPropose
