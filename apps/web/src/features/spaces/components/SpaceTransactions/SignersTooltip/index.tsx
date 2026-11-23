import type { ReactElement } from 'react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { QUEUE_TOOLTIP_DELAY } from '@safe-global/views/features/spaces/components/SpaceQueue/tooltip'
import SignatureGauge from '@safe-global/views/features/spaces/components/SpaceQueue/SignatureGauge'
import SignersList from '@safe-global/views/features/spaces/components/SpaceQueue/SignersList'
import type { QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import useWallet from '@/hooks/wallets/useWallet'
import { useSignerWallets } from '../../../hooks/useSignerWallets'
import { getGaugeLabel, getGaugeTone, getSignersHeader, getStatusHint, getStatusTitle, sortSigners } from './utils'

type SignersTooltipProps = {
  chainId: string
  txId: string
  safeAddress: string
  status: QueueStatus
  nonce?: number
  /** The Safe's next nonce on this chain: what a later transaction waits on */
  nextNonce?: number
  submitted: number
  required: number
}

type ContentProps = SignersTooltipProps & { title: string }

// Mounted only while the tooltip is open, so the details are fetched on demand and fresh on every open
const SignersTooltipContent = ({
  chainId,
  txId,
  safeAddress,
  status,
  title,
  nonce,
  nextNonce,
  submitted,
  required,
}: ContentProps): ReactElement => {
  const { data, isLoading } = useTransactionsGetTransactionByIdV1Query(
    { chainId, id: txId },
    { refetchOnMountOrArgChange: true },
  )
  const wallets = useSignerWallets()
  const connected = useWallet()?.address
  const resolveName = useSafeNameResolver()
  const safeName = useSafeDisplayName(safeAddress, chainId) || shortenAddress(safeAddress)
  const isYou = (address: string) => wallets.has(address.toLowerCase())

  const details = data?.detailedExecutionInfo?.type === 'MULTISIG' ? data.detailedExecutionInfo : undefined
  const signers = details
    ? sortSigners(details.signers, details.confirmations, isYou, (address) => sameAddress(address, connected))
    : []
  const rows = signers.map(({ value, name, signed }) => ({
    address: value,
    signed,
    name: sameAddress(value, connected)
      ? 'You'
      : isYou(value)
        ? `You · ${shortenAddress(value)}`
        : resolveName(value, chainId) || name || shortenAddress(value),
  }))
  const unsigned = rows.filter(({ signed }) => !signed)

  const confirmations = details?.confirmations.length ?? submitted
  const threshold = details?.confirmationsRequired ?? required
  const header = details
    ? getSignersHeader(confirmations, threshold, unsigned.length)
    : getSignersHeader(submitted, required)
  const hint = getStatusHint({
    status,
    nonce,
    nextNonce,
    missing: Math.max(0, threshold - confirmations),
    waitingOn: details ? unsigned.filter(({ address }) => !isYou(address)).map(({ name }) => name) : undefined,
  })
  // Only said once we know the user's wallets: without one, they may simply not have connected it
  const isSigner = signers.some(({ value }) => isYou(value))
  const note = details && wallets.size > 0 && !isSigner ? `You aren't a signer of ${safeName}.` : undefined

  return (
    <>
      <div className="mb-2 border-b border-background/15 pb-2 pt-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 leading-relaxed">{hint}</p>
      </div>
      <SignersList header={header} isLoading={isLoading} signers={rows} note={note} />
    </>
  )
}

/** The signature gauge and count. Its colour carries the row's status; the tooltip names it and lists the signers. */
const SignersTooltip = (props: SignersTooltipProps): ReactElement => {
  const { status, nextNonce, submitted, required } = props
  const title = getStatusTitle(status, nextNonce)
  return (
    // Not hoverable: nothing in it to click, and it would sit over the next row and catch the pointer
    <Tooltip delay={QUEUE_TOOLTIP_DELAY} disableHoverablePopup>
      <TooltipTrigger
        aria-label={getGaugeLabel(title, submitted, required)}
        className="flex w-fit shrink-0 items-center gap-1.5 rounded-sm text-sm tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <SignatureGauge count={submitted} threshold={required} tone={getGaugeTone(status)} />
        {/* Fixed width, up to 10/10, so whatever follows lines up whatever the count */}
        <span className="w-[5ch] text-left">
          {submitted}/{required}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <SignersTooltipContent {...props} title={title} />
      </TooltipContent>
    </Tooltip>
  )
}

export default SignersTooltip
