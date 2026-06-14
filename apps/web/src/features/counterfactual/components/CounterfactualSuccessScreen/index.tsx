import EthHashInfo from '@/components/common/EthHashInfo'
import { safeCreationPendingStatuses } from '../../hooks/safeCreationPendingStatuses'
import { SafeCreationEvent, safeCreationSubscribe } from '../../services/safeCreationEvents'
import { useChain, useCurrentChain } from '@/hooks/useChains'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Check } from 'lucide-react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosList } from '@/features/multichain'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'

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
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="flex flex-col items-center justify-center gap-6 px-12 py-20">
        <div className="inline-flex rounded-full bg-[var(--color-success-background)] p-6">
          <Check className="size-[50px] text-[var(--color-success-main)]" />
        </div>

        <div data-testid="safe-activation-message" className="text-center">
          <Typography data-testid="account-success-message" variant="h3" className="mb-2 font-bold">
            {isCFCreation ? 'Your account is almost set!' : 'Your account is all set!'}
          </Typography>
          <Typography variant="paragraph-small">
            {isCFCreation
              ? `Activate the account ${isMultiChain ? 'per network' : ''} to unlock all features of your smart wallet.`
              : 'Start your journey to the smart account security now.'}
          </Typography>
          <Typography variant="paragraph-small">
            {isCFCreation && isMultiChain
              ? `You can use the address below to receive funds on the selected ${
                  isMultiChain ? 'networks' : 'network'
                }.`
              : `Use your address to receive funds ${chainName ? `on ${chainName}` : ''}`}
          </Typography>
        </div>

        {safeAddress && (
          <div data-testid="safe-info" className="rounded bg-[var(--color-background-main)] p-4 text-sm">
            <NetworkLogosList networks={networks.length > 0 ? networks : chain ? [chain] : []} />
            <Typography variant="h4" className="mt-4">
              {safeName}
            </Typography>
            <EthHashInfo
              address={safeAddress}
              showCopyButton
              shortAddress={false}
              showAvatar={false}
              showName={false}
              showPrefix={false}
            />
          </div>
        )}

        <Button onClick={onClose} data-testid="cf-creation-lets-go-btn">
          Let&apos;s go
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default CounterfactualSuccessScreen
