import EthHashInfo from '@/components/common/EthHashInfo'
import { safeCreationPendingStatuses } from '../../hooks/safeCreationPendingStatuses'
import { SafeCreationEvent, safeCreationSubscribe } from '../../services/safeCreationEvents'
import { useChain, useCurrentChain } from '@/hooks/useChains'
import { useEffect, useState } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosList } from '@/features/multichain'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { CounterfactualSuccessScreenView } from '@views/features/counterfactual/components/CounterfactualSuccessScreen/CounterfactualSuccessScreenView'

const CounterfactualSuccessScreen = () => {
  const [open, setOpen] = useState<boolean>(false)
  const [safeAddress, setSafeAddress] = useState<string>()
  const [chainId, setChainId] = useState<string>()
  const [event, setEvent] = useState<SafeCreationEvent>()
  const currentChain = useCurrentChain()
  const chain = useChain(chainId || currentChain?.chainId || '')
  const [networks, setNetworks] = useState<Chain[]>([])
  const addressBooks = useAllAddressBooks()
  const safeName = safeAddress && chain ? addressBooks?.[chain.chainId]?.[safeAddress] : ''
  const isCFCreation = event === SafeCreationEvent.AWAITING_EXECUTION
  const isMultiChain = networks.length > 1
  const chainName = isMultiChain ? '' : isCFCreation ? networks[0].chainName : chain?.chainName

  useEffect(() => {
    const unsubFns = Object.entries(safeCreationPendingStatuses).map(([event]) =>
      safeCreationSubscribe(event as SafeCreationEvent, async (detail) => {
        setEvent(event as SafeCreationEvent)

        if (event === SafeCreationEvent.INDEXED) {
          if ('chainId' in detail) {
            setChainId(detail.chainId)
            setNetworks((prev) => prev.filter((network) => network.chainId === detail.chainId))
          }

          setSafeAddress(detail.safeAddress)
          setOpen(true)
        }
        if (event === SafeCreationEvent.AWAITING_EXECUTION) {
          if ('networks' in detail) setNetworks(detail.networks)
          setSafeAddress(detail.safeAddress)
          setOpen(true)
        }
      }),
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [])

  const onClose = () => {
    setChainId(undefined)
    setOpen(false)
  }

  return (
    <CounterfactualSuccessScreenView
      open={open}
      isCFCreation={isCFCreation}
      isMultiChain={isMultiChain}
      chainName={chainName}
      hasSafeAddress={!!safeAddress}
      safeName={safeName}
      networkLogos={<NetworkLogosList networks={networks.length > 0 ? networks : chain ? [chain] : []} />}
      addressInfo={
        safeAddress && (
          <EthHashInfo
            address={safeAddress}
            showCopyButton
            shortAddress={false}
            showAvatar={false}
            showName={false}
            showPrefix={false}
          />
        )
      }
      onClose={onClose}
    />
  )
}

export default CounterfactualSuccessScreen
