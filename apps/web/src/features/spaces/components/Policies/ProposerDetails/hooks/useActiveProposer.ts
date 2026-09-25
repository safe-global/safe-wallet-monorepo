import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { ProposerStatus, type ProposerDrawerContentProps } from '../../ProposerDrawer'
import { useProposerOverview } from './useProposerOverview'
import { getRemovableGrantDelegator, REMOVE_PROPOSER_NOT_ALLOWED } from './useRemoveProposer'
import type { ProposerDetailsArgs } from './types'

export const useActiveProposer = (args: ProposerDetailsArgs): ProposerDrawerContentProps => {
  const { chainId, address: safeAddress } = args.policy.safe
  const overview = useProposerOverview(args)
  const safeContact = useAddressBookItem(safeAddress, chainId)
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
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

  const canRemove = getRemovableGrantDelegator(args.proposer, wallet.address) !== undefined

  return {
    status: ProposerStatus.ACTIVE,
    overview,
    actionLabel: 'Remove proposer',
    actionVariant: 'secondary',
    actionDisabled: !canRemove,
    actionHint: canRemove ? undefined : REMOVE_PROPOSER_NOT_ALLOWED,
    onAction: args.onRemove,
  }
}
