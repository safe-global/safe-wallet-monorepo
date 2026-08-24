import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { FilePen as RequiredIcon } from 'lucide-react'
import ImageFallback from '@/components/common/ImageFallback'
import txTypeCss from '@/components/transactions/TxType/styles.module.css'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'

const FALLBACK_LOGO_URI = '/images/transactions/custom.svg'
const MAX_TRIMMED_LENGTH = 20

const getMessageName = (msg: MessageItem) => {
  if (msg.name != null) return msg.name

  if (isEIP712TypedData(msg.message)) {
    return msg.message.domain?.name || ''
  }

  const firstLine = msg.message.split('\n')[0]
  let trimmed = firstLine.slice(0, MAX_TRIMMED_LENGTH)
  if (trimmed.length < firstLine.length) {
    trimmed += '…'
  }
  return trimmed
}

const MsgType = ({ msg }: { msg: MessageItem }) => {
  return (
    <div className={txTypeCss.txType}>
      {msg.logoUri ? (
        <ImageFallback
          src={msg.logoUri || FALLBACK_LOGO_URI}
          fallbackSrc={FALLBACK_LOGO_URI}
          alt="Message type"
          width={16}
          height={16}
        />
      ) : (
        <RequiredIcon strokeWidth={1.5} className="size-4 shrink-0 text-muted-foreground" />
      )}
      {getMessageName(msg)}
    </div>
  )
}

export default MsgType
