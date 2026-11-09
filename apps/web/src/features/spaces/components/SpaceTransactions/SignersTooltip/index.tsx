import type { ReactElement } from 'react'
import { Circle, CircleCheck } from 'lucide-react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@/components/common/Identicon'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { getSignersHeader, sortSigners, type SignerStatus } from './utils'

const SKELETON_ROWS = 3

type SignersTooltipProps = {
  chainId: string
  txId: string
  submitted: number
  required: number
  children: ReactElement
}

const SignerRow = ({ signer, name }: { signer: SignerStatus; name: string }): ReactElement => (
  <li
    data-testid="signer-row"
    data-signed={signer.signed}
    className={cn('flex items-center gap-2', !signer.signed && 'text-background/60')}
  >
    {signer.signed ? (
      <CircleCheck aria-label="Signed" className="size-4 shrink-0 fill-success-strong text-foreground" />
    ) : (
      <Circle aria-label="Not signed" className="size-4 shrink-0 text-background/40" />
    )}
    <Identicon address={signer.value} size={18} />
    <span className="truncate">{name}</span>
  </li>
)

const SignersList = ({ chainId, txId, submitted, required }: Omit<SignersTooltipProps, 'children'>): ReactElement => {
  const { data, isLoading } = useTransactionsGetTransactionByIdV1Query({ chainId, id: txId })
  const wallet = useWallet()
  const resolveName = useSafeNameResolver()
  const details = data?.detailedExecutionInfo?.type === 'MULTISIG' ? data.detailedExecutionInfo : undefined
  const signers = details ? sortSigners(details.signers, details.confirmations) : undefined

  const header =
    details && signers
      ? getSignersHeader(
          details.confirmations.length,
          details.confirmationsRequired,
          signers.filter(({ signed }) => !signed).length,
        )
      : getSignersHeader(submitted, required)

  return (
    <div className="flex flex-col gap-2 py-1">
      <p className="whitespace-nowrap font-medium">{header}</p>
      {isLoading && (
        <ul className="flex flex-col gap-1.5" aria-busy="true">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <li key={i} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full bg-background/20" />
              <Skeleton className="h-3 w-20 bg-background/20" />
            </li>
          ))}
        </ul>
      )}
      {signers && signers.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {signers.map((signer) => (
            <SignerRow
              key={signer.value}
              signer={signer}
              name={
                sameAddress(signer.value, wallet?.address)
                  ? 'You'
                  : resolveName(signer.value, chainId) || signer.name || shortenAddress(signer.value)
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

const SignersTooltip = ({ children, ...props }: SignersTooltipProps): ReactElement => (
  <Tooltip delay={150}>
    <TooltipTrigger render={children} />
    <TooltipContent className="max-w-sm">
      <SignersList {...props} />
    </TooltipContent>
  </Tooltip>
)

export default SignersTooltip
