import { useCallback, useContext } from 'react'
import { getSafeDisplayInfo } from '@/components/common/AccountRow'
import { TxModalContext } from '@/components/tx-flow'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import type { ParentSafeWalletCopy, ParentSafeWalletNoticeProps } from '../components/ParentSafeWalletNotice'
import type { SafeAccountOption } from '../SafeAccountSelector/types'
import { useParentSafeWallet } from './useParentSafeWallet'

/** Notice props for the picked account when the connected wallet is its parent Safe; the link closes the flow without the discard prompt. */
export const useParentSafeWalletNotice = (
  account: SafeAccountOption | undefined,
  copy: ParentSafeWalletCopy,
): ParentSafeWalletNoticeProps | undefined => {
  const { setTxFlow } = useContext(TxModalContext)
  const spaceId = useUrlSpaceId()
  const parentSafeAddress = useParentSafeWallet(account?.chainId)
  const parentContact = useAddressBookItem(parentSafeAddress ?? '', account?.chainId)
  const closeWithoutPrompt = useCallback(() => setTxFlow(undefined, undefined, false), [setTxFlow])

  if (!account || !parentSafeAddress) return undefined

  return {
    ...copy,
    safeName: getSafeDisplayInfo(account.name ?? '', account.address).displayName,
    parentSafeName: getSafeDisplayInfo(parentContact?.name ?? '', parentSafeAddress).displayName,
    settingsHref: buildSafeHref(AppRoutes.settings.setup, account.chain?.shortName, account.address, spaceId),
    onNavigate: closeWithoutPrompt,
  }
}
