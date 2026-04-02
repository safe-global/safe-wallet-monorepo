import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { AccountItem } from '@/features/myAccounts/components/AccountItem'
import Identicon from '@/components/common/Identicon'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Tooltip } from '@mui/material'
import FiatBalance from '../SelectSafesOnboarding/components/FiatBalance'
import ThresholdBadge from '../SelectSafesOnboarding/components/ThresholdBadge'
import useSafeCardData from '../SelectSafesOnboarding/hooks/useSafeCardData'
import { useLoadFeature } from '@/features/__core__'
import { SpacesFeature } from '@/features/spaces'
import { useGetSafeOverviewQuery } from '@/store/api/gateway'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useChain } from '@/hooks/useChains'

interface SafeCardReadOnlyProps {
  safe: SafeItem | MultiChainSafeItem
  isSimilar?: boolean
}

const SafeCardReadOnly = ({ safe, isSimilar }: SafeCardReadOnlyProps) => {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const isMultiChain = isMultiChainSafeItem(safe)
  const { name, fiatValue, threshold, ownersCount, elementRef } = useSafeCardData(safe)
  const safes = isMultiChain ? (safe as MultiChainSafeItem).safes : [safe as SafeItem]
  const singleSafe = safes[0]
  const spaces = useLoadFeature(SpacesFeature)
  const chain = useChain(singleSafe?.chainId || '')

  // Fetch SafeOverview for pending transaction info
  const { data: safeOverview } = useGetSafeOverviewQuery(
    { chainId: singleSafe?.chainId, safeAddress: singleSafe?.address },
    { skip: !singleSafe },
  )

  const hasQueuedItems =
    safeOverview && ((safeOverview.queued ?? 0) > 0 || (safeOverview.awaitingConfirmation ?? 0) > 0)

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(safe.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCardClick = () => {
    if (!singleSafe || !chain?.shortName) return

    router.push({
      pathname: AppRoutes.home,
      query: {
        safe: `${chain.shortName}:${singleSafe.address}`,
      },
    })
  }

  return (
    <div
      ref={elementRef as React.Ref<HTMLDivElement>}
      onClick={handleCardClick}
      className="box-border flex w-full min-w-0 max-w-full items-center gap-1.5 rounded-3xl border-2 border-card bg-card py-4 pl-3 pr-3 transition-colors hover:bg-muted/50 sm:gap-2 sm:pl-6 sm:pr-6 cursor-pointer"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <span className="inline-flex shrink-0">
          <Identicon address={safe.address} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {isSimilar && (
            <Badge variant="warning" className="self-start -ml-px">
              <TriangleAlert data-icon="inline-start" />
              High similarity
            </Badge>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-medium text-foreground">
              {name || shortenAddress(safe.address)}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="block min-w-0 break-all text-xs text-muted-foreground">
              {isSimilar ? (
                <>
                  {safe.address.slice(0, 2)}
                  <b>{safe.address.slice(2, 6)}</b>
                  {safe.address.slice(6, -4)}
                  <b>{safe.address.slice(-4)}</b>
                </>
              ) : (
                shortenAddress(safe.address)
              )}
            </span>
            <Tooltip title={copied ? 'Copied!' : 'Copy address'} placement="top">
              <button
                onClick={handleCopyAddress}
                className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors cursor-pointer"
                aria-label="Copy address"
                type="button"
              >
                {copied ? (
                  <Check className="size-3.5 text-green-600" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center justify-end gap-1 pl-1 sm:pl-2">
        {hasQueuedItems && (
          <div className="flex shrink-0 items-center gap-1 mr-8">
            {(safeOverview?.queued ?? 0) > 0 && (
              <Badge variant="secondary" className="text-xs">
                {safeOverview.queued} pending
              </Badge>
            )}
            {(safeOverview?.awaitingConfirmation ?? 0) > 0 && (
              <Badge variant="warning" className="text-xs">
                {safeOverview.awaitingConfirmation} to confirm
              </Badge>
            )}
          </div>
        )}
        <AccountItem.ChainBadge safes={safes} className="justify-end" />
      </div>

      <div className="flex min-w-0 shrink-0 flex-col items-end gap-2 pl-1 sm:min-w-16 sm:pl-0">
        <FiatBalance value={fiatValue} />
        {threshold > 0 && <ThresholdBadge threshold={threshold} owners={ownersCount} />}
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
        {spaces?.SpaceSafeContextMenu && <spaces.SpaceSafeContextMenu safeItem={safe} />}
      </div>
    </div>
  )
}

export default SafeCardReadOnly
