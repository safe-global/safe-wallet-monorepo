import { useChain } from '@/hooks/useChains'
import { type ReactElement } from 'react'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import SrcEthHashInfo, { type EthHashInfoProps } from './SrcEthHashInfo'

const EthHashInfo = ({
  showName = true,
  avatarSize = 40,
  ...props
}: EthHashInfoProps & { showName?: boolean }): ReactElement => {
  const settings = useAppSelector(selectSettings)
  const currentChainId = useChainId()
  const chain = useChain(props.chainId || currentChainId)
  const addressBookItem = useAddressBookItem(props.address, chain?.chainId)
  const { ens, avatar: ensAvatar } = useAddressResolver(props.address)
  const link = chain && props.hasExplorer ? getBlockExplorerLink(chain, props.address) : undefined
  const name = showName ? props.name || addressBookItem?.name || ens : undefined
  const customAvatar = props.customAvatar || ensAvatar

  return (
    <SrcEthHashInfo
      prefix={chain?.shortName}
      copyPrefix={settings.shortName.copy}
      {...props}
      name={name}
      addressBookNameSource={props.addressBookNameSource || addressBookItem?.source}
      customAvatar={customAvatar}
      ExplorerButtonProps={{ title: link?.title || '', href: link?.href || '' }}
      avatarSize={avatarSize}
    >
      {props.children}
    </SrcEthHashInfo>
  )
}

export default EthHashInfo
