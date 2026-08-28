import type { ReactNode } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@/components/ui/typography'
import { formatAllowance } from '../../utils/policyLabel'
import type { PolicyAllowance, PolicySpender } from '../../types'

export type AllowanceDetail = (allowance: PolicyAllowance) => ReactNode

type PolicyLimitsProps = {
  spenders: PolicySpender[]
  chainId: string
  /** Rendered under each allowance. Only active policies have usage to show. */
  renderAllowanceDetail?: AllowanceDetail
}

/**
 * The limits section: every spender, and under each spender every token with its amount and period.
 * The table shows one row for the whole policy, so this is the only place the individual spenders
 * are visible.
 */
const PolicyLimits = ({ spenders, chainId, renderAllowanceDetail }: PolicyLimitsProps) => {
  if (spenders.length === 0) return null

  return (
    <section className="flex flex-col gap-3" data-testid="policy-limits" aria-label="Limits">
      <Typography variant="paragraph-small" className="px-1 text-muted-foreground uppercase">
        Limits
      </Typography>

      {spenders.map((spender, index) => (
        <div key={spender.spender} className="flex flex-col rounded-lg bg-card" data-testid="policy-spender">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Typography variant="paragraph-bold">Spender {index + 1}</Typography>
            <EthHashInfo
              address={spender.spender}
              chainId={chainId}
              shortAddress
              showPrefix={false}
              showCopyButton
              avatarSize={20}
            />
          </div>

          {spender.allowances.map((allowance) => (
            <div key={allowance.token.address} className="flex flex-col gap-1 px-4 pb-3" data-testid="policy-allowance">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <TokenIcon
                    logoUri={allowance.token.logoUri ?? undefined}
                    tokenSymbol={allowance.token.symbol}
                    size={24}
                  />
                  <Typography variant="paragraph-medium" className="truncate">
                    {allowance.token.symbol}
                  </Typography>
                </span>

                <Typography variant="paragraph-medium" className="shrink-0">
                  {formatAllowance(allowance)}
                </Typography>
              </div>

              {renderAllowanceDetail?.(allowance)}
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

export default PolicyLimits
