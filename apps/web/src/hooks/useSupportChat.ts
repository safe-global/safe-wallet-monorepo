import { useContext, useMemo } from 'react'
import { WalletContext } from '@/components/common/WalletProvider'
import useSafeAddress from '@/hooks/useSafeAddress'
import { shortenAddress, deriveAliasEmail } from '@safe-global/support-chat-embed'
import type { SupportChatConfig, UserIdentity } from '@safe-global/support-chat-embed'
import {
  SUPPORT_CHAT_APP_ID,
  SUPPORT_CHAT_URL,
  SUPPORT_CHAT_ALIAS_DOMAIN,
  SUPPORT_CHAT_ALLOWED_PARENTS,
} from '@/config/constants'

export const useSupportChat = () => {
  const { connectedWallet } = useContext(WalletContext) ?? {}
  const safeAddress = useSafeAddress()

  const config: SupportChatConfig = useMemo(
    () => ({
      appId: SUPPORT_CHAT_APP_ID,
      chatUrl: SUPPORT_CHAT_URL,
      aliasDomain: SUPPORT_CHAT_ALIAS_DOMAIN,
      allowedParents: SUPPORT_CHAT_ALLOWED_PARENTS.split(/\s+/),
    }),
    [],
  )

  const user: UserIdentity = useMemo(() => {
    const aliasSource = connectedWallet?.address || safeAddress
    const email = aliasSource ? deriveAliasEmail(aliasSource) : `guest@${SUPPORT_CHAT_ALIAS_DOMAIN}`

    let name = 'Safe User'
    if (connectedWallet?.ens) {
      name = connectedWallet.ens
    } else if (connectedWallet?.label) {
      name = connectedWallet.label
    } else if (connectedWallet?.address) {
      name = shortenAddress(connectedWallet.address)
    } else if (safeAddress) {
      name = shortenAddress(safeAddress)
    }

    return {
      email,
      name,
      avatarUrl: connectedWallet?.icon,
      accountId: safeAddress,
    }
  }, [connectedWallet, safeAddress])

  return { config, user }
}
