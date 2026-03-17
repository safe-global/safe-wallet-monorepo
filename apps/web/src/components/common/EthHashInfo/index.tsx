import { useChain } from '@/hooks/useChains'
import { type ReactElement } from 'react'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import SrcEthHashInfo, { type EthHashInfoProps } from './SrcEthHashInfo'
import { selectAddedSafes } from '@/store/addedSafesSlice'
import useSafeAddress from '@/hooks/useSafeAddress'

const EthHashInfo = ({
  showName = true,
  avatarSize = 40,
  ...props
}: EthHashInfoProps & { showName?: boolean }): ReactElement => {
  const settings = useAppSelector(selectSettings)
  const currentChainId = useChainId()
  const safeAddress = useSafeAddress()
  const addedSafes = useAppSelector((state) => selectAddedSafes(state, currentChainId)) || {}
  const chain = useChain(props.chainId || currentChainId)
  const addressBookItem = useAddressBookItem(props.address, chain?.chainId)
  const link = chain && props.hasExplorer ? getBlockExplorerLink(chain, props.address) : undefined
  const name = showName ? addressBookItem?.name || props.name : undefined
  const showEmoji =
    settings.addressEmojis &&
    props.showAvatar !== false &&
    !props.customAvatar &&
    avatarSize >= 20 &&
    (safeAddress === props.address || props.address in addedSafes)

  return (
    <SrcEthHashInfo
      prefix={chain?.shortName}
      copyPrefix={settings.shortName.copy}
      {...props}
      name={name}
      addressBookNameSource={props.addressBookNameSource || addressBookItem?.source}
      customAvatar={props.customAvatar}
      ExplorerButtonProps={{ title: link?.title || '', href: link?.href || '' }}
      avatarSize={avatarSize}
      badgeTooltip={props.badgeTooltip}
      showEmoji={showEmoji}
    >
      {props.children}
    </SrcEthHashInfo>
  )
}

export default EthHashInfo
