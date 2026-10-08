import { type ReactElement } from 'react'
import SafeIcon from '@/components/common/SafeIcon'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { useChain } from '@/hooks/useChains'
import { SafeInfoView } from '@views/components/tx-flow/common/SafeInfo/SafeInfoView'

const SafeInfo = (): ReactElement => {
  const safeAddress = useSafeAddress()
  const chainId = useChainId()
  const { ens } = useAddressResolver(safeAddress)
  const addressBookItem = useAddressBookItem(safeAddress, chainId)
  const chain = useChain(chainId)

  const name = addressBookItem?.name || ens
  const prefix = chain?.shortName

  return (
    <SafeInfoView
      safeAddress={safeAddress}
      name={name}
      prefix={prefix}
      safeIcon={<SafeIcon address={safeAddress} size={32} />}
      renderCopyAddressButton={(children) => <CopyAddressButton address={safeAddress}>{children}</CopyAddressButton>}
    />
  )
}

export default SafeInfo
