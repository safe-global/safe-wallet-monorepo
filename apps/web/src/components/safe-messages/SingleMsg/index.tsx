import type { ReactNode } from 'react'
import { useRouter } from 'next/router'
import ExpandableMsgItem from '../MsgListItem/ExpandableMsgItem'
import useSafeMessage from '@/hooks/messages/useSafeMessage'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { SingleMsgView } from '@views/components/safe-messages/SingleMsg/SingleMsgView'

const SingleMsg = () => {
  const router = useRouter()
  const { messageHash } = router.query
  const safeMessageHash = Array.isArray(messageHash) ? messageHash[0] : messageHash
  const [safeMessage, , messageError] = useSafeMessage(safeMessageHash)

  return (
    <SingleMsgView
      message={safeMessage && <ExpandableMsgItem msg={safeMessage} expanded />}
      hasError={!!messageError}
      renderErrorMessage={(children: ReactNode) => <ErrorMessage error={messageError}>{children}</ErrorMessage>}
    />
  )
}

export default SingleMsg
