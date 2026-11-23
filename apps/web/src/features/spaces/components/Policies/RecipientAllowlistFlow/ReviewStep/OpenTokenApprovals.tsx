import type { ReactElement } from 'react'
import { UNLIMITED_APPROVAL_AMOUNT } from '@safe-global/utils/utils/tokens'
import { formatVisualAmount, shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import TokenApprovalsReview, {
  type TokenApprovalsReviewProps,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/TokenApprovalsReview'
import {
  NO_TOKEN_APPROVALS_TITLE,
  RETRY_LABEL,
  TOKEN_APPROVALS_INCOMPLETE_TITLE,
  TOKEN_APPROVALS_LOAD_ERROR_TITLE,
  TOKEN_APPROVALS_MAY_REMAIN_DESCRIPTION,
  TOKEN_APPROVALS_UNLIMITED,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import TokenIcon from '@/components/common/TokenIcon'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import type { TokenApproval, TokenApprovals } from '@/store/api/gateway/tokenApprovals'
import AccountIdentity from '../../components/AccountIdentity/AccountIdentity'

type OpenTokenApprovalsProps = {
  chainId: string
  approvals?: TokenApprovals
  isError: boolean
  onRetry: () => void
}

const formatAllowance = ({ allowance, tokenMetadata }: TokenApproval): string => {
  if (BigInt(allowance) === UNLIMITED_APPROVAL_AMOUNT) return TOKEN_APPROVALS_UNLIMITED
  if (!tokenMetadata) return allowance
  return `${formatVisualAmount(allowance, tokenMetadata.decimals)} ${tokenMetadata.symbol}`
}

/** The open token approvals of the Safe, which a first setup revokes, and whether the list can be trusted to be complete. */
const OpenTokenApprovals = ({ chainId, approvals, isError, onRetry }: OpenTokenApprovalsProps): ReactElement => {
  const resolveName = useSafeNameResolver()

  const rows = (approvals?.approvals ?? []).map((approval) => {
    const symbol = approval.tokenMetadata?.symbol ?? shortenAddress(approval.tokenAddress)
    return {
      key: `${approval.tokenAddress}-${approval.spender}`,
      token: (
        <>
          <TokenIcon logoUri={approval.tokenMetadata?.logoUri} tokenSymbol={symbol} size={24} />
          <Typography variant="paragraph-small-medium">{symbol}</Typography>
        </>
      ),
      spender: (
        <AccountIdentity address={approval.spender} name={resolveName(approval.spender, chainId) || undefined} />
      ),
      amount: formatAllowance(approval),
    }
  })

  const getNotice = (): TokenApprovalsReviewProps['notice'] => {
    if (isError) {
      return {
        tone: 'warning',
        title: TOKEN_APPROVALS_LOAD_ERROR_TITLE,
        description: TOKEN_APPROVALS_MAY_REMAIN_DESCRIPTION,
        action: (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {RETRY_LABEL}
          </Button>
        ),
      }
    }
    if (!approvals) return undefined
    if (!approvals.isComplete) {
      return {
        tone: 'warning',
        title: TOKEN_APPROVALS_INCOMPLETE_TITLE,
        description: TOKEN_APPROVALS_MAY_REMAIN_DESCRIPTION,
      }
    }
    if (approvals.approvals.length === 0) return { tone: 'success', title: NO_TOKEN_APPROVALS_TITLE }
    return undefined
  }

  return <TokenApprovalsReview rows={rows} notice={getNotice()} />
}

export default OpenTokenApprovals
