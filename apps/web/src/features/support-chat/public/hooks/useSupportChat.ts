import { useMemo } from 'react'
import useSafeAddress from '@/hooks/useSafeAddress'
import {
  SUPPORT_CHAT_APP_ID,
  SUPPORT_CHAT_URL,
  SUPPORT_CHAT_ALIAS_DOMAIN,
  SUPPORT_CHAT_ALLOWED_PARENTS,
} from '@/config/constants'

export type SupportChatConfig = {
  appId: string
  chatUrl: string
  aliasDomain: string
  allowedParents: string[]
}

export type UserIdentity = {
  email: string
  name: string
  avatarUrl?: string
  accountId?: string
}

const deriveAliasEmail = (address: string): string => {
  return `${address.toLowerCase()}@${SUPPORT_CHAT_ALIAS_DOMAIN}`
}

export const useSupportChat = () => {
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
    const email = safeAddress ? deriveAliasEmail(safeAddress) : `guest@${SUPPORT_CHAT_ALIAS_DOMAIN}`

    return {
      email,
      name: 'Safe{Wallet}',
      accountId: safeAddress,
    }
  }, [safeAddress])

  return { config, user }
}
