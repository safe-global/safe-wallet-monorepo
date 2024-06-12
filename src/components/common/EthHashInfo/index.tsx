import { useChain } from '@/hooks/useChains'
import { type ReactElement } from 'react'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { getBlockExplorerLink } from '@/utils/chains'
import SrcEthHashInfo, { type EthHashInfoProps } from './SrcEthHashInfo'
import { REMOVE_POPULATE_INITIAL_STATE } from '../SuperChainEOAS'

const EthHashInfo = ({
  showName = true,
  avatarSize = 40,
  isPopulated = false,
  ...props
}: EthHashInfoProps & {
  showName?: boolean
  isPopulated?: boolean
  setRemovePopulateContext: (arg1: typeof REMOVE_POPULATE_INITIAL_STATE) => void
}): ReactElement => {
  const settings = useAppSelector(selectSettings)
  const currentChainId = useChainId()
  const chain = useChain(props.chainId || currentChainId)
  const addressBooks = useAllAddressBooks()
  const link = chain && props.hasExplorer ? getBlockExplorerLink(chain, props.address) : undefined
  const name = showName && chain ? addressBooks?.[chain.chainId]?.[props.address] || props.name : undefined

  return (
    <SrcEthHashInfo
      prefix={chain?.shortName}
      copyPrefix={settings.shortName.copy}
      {...props}
      isPopulated={isPopulated}
      name={name}
      hasExplorer={!isPopulated}
      showCopyButton={!isPopulated}
      customAvatar={props.customAvatar}
      ExplorerButtonProps={{ title: link?.title || '', href: link?.href || '' }}
      avatarSize={avatarSize}
    >
      {props.children}
    </SrcEthHashInfo>
  )
}

export default EthHashInfo
