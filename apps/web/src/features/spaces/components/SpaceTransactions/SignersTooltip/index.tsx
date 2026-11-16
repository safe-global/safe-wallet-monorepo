import type { ReactElement } from 'react'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import SignersList from '@safe-global/views/features/spaces/components/SpaceQueue/SignersList'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { getSignersHeader, sortSigners } from './utils'

type SignersTooltipProps = {
  chainId: string
  txId: string
  submitted: number
  required: number
  children: ReactElement
}

const Signers = ({ chainId, txId, submitted, required }: Omit<SignersTooltipProps, 'children'>): ReactElement => {
  const { data, isLoading } = useTransactionsGetTransactionByIdV1Query(
    { chainId, id: txId },
    { refetchOnMountOrArgChange: true },
  )
  const wallet = useWallet()
  const resolveName = useSafeNameResolver()
  const details = data?.detailedExecutionInfo?.type === 'MULTISIG' ? data.detailedExecutionInfo : undefined
  const signers = details ? sortSigners(details.signers, details.confirmations) : []

  const header = details
    ? getSignersHeader(
        details.confirmations.length,
        details.confirmationsRequired,
        signers.filter(({ signed }) => !signed).length,
      )
    : getSignersHeader(submitted, required)

  return (
    <SignersList
      header={header}
      isLoading={isLoading}
      signers={signers.map(({ value, name, signed }) => ({
        address: value,
        signed,
        name: sameAddress(value, wallet?.address)
          ? 'You'
          : resolveName(value, chainId) || name || shortenAddress(value),
      }))}
    />
  )
}

const SignersTooltip = ({ children, ...props }: SignersTooltipProps): ReactElement => (
  <Tooltip delay={150}>
    <TooltipTrigger render={children} />
    <TooltipContent className="max-w-sm">
      <Signers {...props} />
    </TooltipContent>
  </Tooltip>
)

export default SignersTooltip
