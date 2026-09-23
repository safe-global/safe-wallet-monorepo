import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafeOverviews } from '../../../../hooks/useSpaceSafeOverviews'
import { ProposerStatus, type ProposerDrawerContentProps } from '../../ProposerDrawer'
import { useProposerOverview } from './useProposerOverview'
import type { ProposerDetailsArgs } from './types'

export const useActiveProposer = (args: ProposerDetailsArgs): ProposerDrawerContentProps => {
  const { chainId, address: safeAddress } = args.policy.safe
  const overview = useProposerOverview(args)
  const safeContact = useAddressBookItem(safeAddress, chainId)
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const { ownedByChain } = useSpaceSafeOverviews([{ chainId, address: safeAddress }])

  const isSigner = (ownedByChain[chainId] ?? []).some((owned) => sameAddress(owned, safeAddress))
  const safeName = getSafeDisplayInfo(safeContact?.name ?? '', safeAddress).displayName

  if (!wallet) {
    return {
      status: ProposerStatus.ACTIVE,
      overview,
      actionLabel: 'Connect wallet',
      actionHint: `Connect a signer wallet of ${safeName} to edit.`,
      onAction: connectWallet,
    }
  }

  return {
    status: ProposerStatus.ACTIVE,
    overview,
    actionLabel: 'Remove proposer',
    actionVariant: 'secondary',
    actionDisabled: !isSigner,
    actionHint: isSigner ? undefined : `Only signers of ${safeName} can delete or edit this Proposer role.`,
    onAction: args.onRemove,
  }
}
