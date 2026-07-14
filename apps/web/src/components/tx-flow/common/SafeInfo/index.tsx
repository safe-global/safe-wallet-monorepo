import { type ReactElement } from 'react'
import SafeIcon from '@/components/common/SafeIcon'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useChain } from '@/hooks/useChains'

const SafeInfo = (): ReactElement => {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const { ens } = useAddressResolver(safeAddress)
  const addressBookItem = useAddressBookItem(safeAddress, chainId)
  const chain = useChain(chainId)

  const name = addressBookItem?.name || ens
  const prefix = chain?.shortName

  return (
    <div data-testid="tx-flow-safe-info" className="flex flex-row items-center gap-2">
      <div data-testid="safe-icon">
        {safeAddress ? <SafeIcon address={safeAddress} size={32} /> : <Skeleton className="size-8 rounded-full" />}
      </div>

      <div className="overflow-hidden">
        {safeAddress ? (
          <>
            {name && (
              <Typography variant="paragraph-small-bold" className="overflow-hidden text-ellipsis whitespace-nowrap">
                {name}
              </Typography>
            )}
            <Typography variant="paragraph-small">
              <CopyAddressButton address={safeAddress}>
                {prefix && <b>{prefix}:</b>}
                {shortenAddress(safeAddress)}
              </CopyAddressButton>
            </Typography>
          </>
        ) : (
          <Typography variant="paragraph-small">
            <Skeleton className="h-4 w-[86px]" />
            <Skeleton className="h-4 w-[120px]" />
          </Typography>
        )}
      </div>
    </div>
  )
}

export default SafeInfo
