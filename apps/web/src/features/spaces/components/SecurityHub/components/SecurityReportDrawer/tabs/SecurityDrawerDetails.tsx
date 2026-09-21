import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import Identicon from '@/components/common/Identicon'
import CopyTooltip from '@/components/common/CopyTooltip'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useChain } from '@/hooks/useChains'
import { useLoadFeature } from '@/features/__core__'
import { SecurityFeature } from '@/features/security'
import type { ScanContext } from '@/features/security/types'
import { cn } from '@/utils/cn'

type SecurityDrawerDetailsProps = {
  scanContext: ScanContext | null
  /** Epoch ms of the last scan, surfaced as a relative "Last scanned" time. */
  lastScannedAt: number | null
}

const SectionLabel = ({ children, className }: { children: ReactNode; className?: string }): ReactElement => (
  <Typography variant="paragraph-mini" color="muted" className={cn('mb-1 block', className)}>
    {children}
  </Typography>
)

const DetailRow = ({ label, value }: { label: string; value: ReactNode }): ReactElement => (
  <div className="flex items-center px-4 justify-between py-2.5">
    <Typography variant="paragraph-mini" color="muted">
      {label}
    </Typography>
    <Typography variant="paragraph-mini">{value}</Typography>
  </div>
)

/** "Details" tab — the Safe's signers and high-level account facts. */
const SecurityDrawerDetails = ({ scanContext, lastScannedAt }: SecurityDrawerDetailsProps): ReactElement | null => {
  const security = useLoadFeature(SecurityFeature)
  const chain = useChain(scanContext?.chainId ?? '')

  if (!scanContext) return null

  const { owners, threshold, version, balanceUsd } = scanContext

  const aboutRows: { label: string; value: ReactNode }[] = [
    { label: 'Contract version', value: version ? `v${version}` : '—' },
    { label: 'Networks', value: chain?.chainName ?? '—' },
    { label: 'Balance', value: formatCurrencyPrecise(balanceUsd, 'USD') },
    {
      label: 'Last scanned',
      value: security.$isReady ? security.formatTimestamp(lastScannedAt ?? undefined) : '—',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-card p-4 rounded-xl">
        <SectionLabel>{`Signers · ${threshold}/${owners.length}`}</SectionLabel>
        <div className="flex flex-col">
          {owners.map((owner) => (
            <div key={owner.value} className="flex items-center gap-3 py-2.5">
              <Identicon address={owner.value} size={24} />
              <Typography variant="paragraph-mini" className="min-w-0 flex-1 truncate" title={owner.value}>
                {owner.name || shortenAddress(owner.value)}
              </Typography>
              <CopyTooltip text={owner.value}>
                <span
                  aria-label="Copy address"
                  className="flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </span>
              </CopyTooltip>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card py-4 rounded-xl">
        <SectionLabel className="px-4">About</SectionLabel>
        <Separator className="bg-muted" />
        <div className="flex flex-col">
          {aboutRows.map((row, idx) => (
            <Fragment key={row.label}>
              {idx > 0 && <Separator className="bg-muted" />}
              <DetailRow label={row.label} value={row.value} />
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  )
}

export default SecurityDrawerDetails
