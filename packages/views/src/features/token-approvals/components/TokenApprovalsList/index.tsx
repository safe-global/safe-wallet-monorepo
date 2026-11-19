import { Fragment, type ReactElement } from 'react'
import { RotateCw } from 'lucide-react'
import ExplorerButton from '@safe-global/views/components/common/ExplorerButton'
import Identicon from '@safe-global/views/components/common/Identicon'
import ImageFallback from '@safe-global/views/components/common/ImageFallback'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'

export type TokenApprovalItem = {
  key: string
  tokenAddress: string
  tokenSymbol: string
  tokenLogoUri?: string | null
  spenderAddress: string
  /** The spender's known name, or its shortened address */
  spenderLabel: string
  spenderHref?: string
  /** "Unlimited" or the formatted allowance with its symbol */
  amountLabel: string
  isUnlimited: boolean
}

export type TokenApprovalsListProps = {
  approvals: TokenApprovalItem[]
  checkedAtLabel: string
  onRescan: () => void
}

const SCOPE_NOTE = "Doesn't cover off-chain approvals (permit signatures)."

const TokenIcon = ({ address, logoUri }: { address: string; logoUri?: string | null }): ReactElement => (
  <ImageFallback
    src={logoUri ?? undefined}
    alt=""
    className="size-5 shrink-0 rounded-full"
    fallbackComponent={<Identicon address={address} size={20} />}
  />
)

const ApprovalRow = ({ approval }: { approval: TokenApprovalItem }): ReactElement => (
  <div className="flex items-center gap-2.5 py-2">
    <TokenIcon address={approval.tokenAddress} logoUri={approval.tokenLogoUri} />

    <div className="flex min-w-0 flex-1 flex-col">
      <Typography variant="paragraph-mini-medium" className="truncate" title={approval.tokenAddress}>
        {approval.tokenSymbol}
      </Typography>
      <span className="flex min-w-0 items-center gap-1">
        <Typography variant="paragraph-mini" color="muted" className="truncate" title={approval.spenderAddress}>
          Spender: {approval.spenderLabel}
        </Typography>
        <ExplorerButton href={approval.spenderHref} title="View spender on explorer" />
      </span>
    </div>

    {approval.isUnlimited ? (
      <Badge variant="warning" size="sm" className="shrink-0">
        {approval.amountLabel}
      </Badge>
    ) : (
      <Typography variant="paragraph-mini-medium" className="shrink-0">
        {approval.amountLabel}
      </Typography>
    )}
  </div>
)

/** Every ERC-20 allowance a Safe has given, nested in its Security Hub check row */
const TokenApprovalsList = ({ approvals, checkedAtLabel, onRescan }: TokenApprovalsListProps): ReactElement => (
  <div className="flex flex-col gap-2">
    {approvals.length > 0 && (
      <div className="flex flex-col">
        {approvals.map((approval, idx) => (
          <Fragment key={approval.key}>
            {idx > 0 && <Separator />}
            <ApprovalRow approval={approval} />
          </Fragment>
        ))}
      </div>
    )}

    <div className="flex items-center justify-between gap-2">
      <Typography variant="paragraph-mini" color="muted">
        Checked {checkedAtLabel}
      </Typography>
      <Button variant="ghost" size="2xs" onClick={onRescan}>
        <RotateCw />
        Rescan
      </Button>
    </div>

    <Typography variant="paragraph-mini" color="muted">
      {SCOPE_NOTE}
    </Typography>
  </div>
)

export default TokenApprovalsList
