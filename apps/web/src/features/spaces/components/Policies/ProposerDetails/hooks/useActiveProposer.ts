import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { AppRoutes } from '@/config/routes'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ProposerStatus, type ProposerDrawerContentProps } from '../../ProposerDrawer'
import { useNestedSafeGrantor } from './useNestedSafeGrantor'
import { useProposerOverview } from './useProposerOverview'
import { getRemovableGrantDelegator, REMOVE_PROPOSER_NOT_ALLOWED } from './useRemoveProposer'
import type { ProposerDetailsArgs } from './types'

export const REMOVE_NESTED_PROPOSER_HINT = 'Remove this proposer from the Safe account settings'

export const useActiveProposer = (args: ProposerDetailsArgs): ProposerDrawerContentProps => {
  const { chainId, address: safeAddress } = args.policy.safe
  const overview = useProposerOverview(args)
  const safeContact = useAddressBookItem(safeAddress, chainId)
  const chain = useChain(chainId)
  const nestedSafeGrantor = useNestedSafeGrantor(chainId, args.proposer)
  const grantorContact = useAddressBookItem(nestedSafeGrantor ?? '', chainId)
  const wallet = useWallet()
  const connectWallet = useConnectWallet()
  const safeName = getSafeDisplayInfo(safeContact?.name ?? '', safeAddress).displayName

  const hasOwnGrant = args.proposer.delegatedBy.some((grant) => sameAddress(grant.delegator, wallet?.address))
  const nestedSafeGrant =
    nestedSafeGrantor && !hasOwnGrant
      ? {
          safeName,
          parentSafeName: getSafeDisplayInfo(grantorContact?.name ?? '', nestedSafeGrantor).displayName,
          settingsHref: chain
            ? { pathname: AppRoutes.settings.setup, query: { safe: `${chain.shortName}:${safeAddress}` } }
            : undefined,
        }
      : undefined

  if (!wallet) {
    return {
      status: ProposerStatus.ACTIVE,
      overview,
      nestedSafeGrant,
      actionLabel: 'Connect wallet',
      actionHint: `Connect a signer wallet of ${safeName} to edit.`,
      onAction: connectWallet,
    }
  }

  if (nestedSafeGrant) {
    return {
      status: ProposerStatus.ACTIVE,
      overview,
      nestedSafeGrant,
      actionLabel: 'Remove proposer',
      actionVariant: 'secondary',
      actionDisabled: true,
      actionHint: REMOVE_NESTED_PROPOSER_HINT,
      onAction: args.onRemove,
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
