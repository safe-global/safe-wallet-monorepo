import useSafeMessages from '@/hooks/messages/useSafeMessages'
import { SignedMessagesHelpLinkView } from '@views/components/transactions/SignedMessagesHelpLink/SignedMessagesHelpLinkView'

const SignedMessagesHelpLink = () => {
  const { page } = useSafeMessages()
  const safeMessagesCount = page?.results.length ?? 0

  if (safeMessagesCount === 0) {
    return null
  }

  return <SignedMessagesHelpLinkView />
}

export default SignedMessagesHelpLink
