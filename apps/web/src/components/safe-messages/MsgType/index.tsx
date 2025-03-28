import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Box, SvgIcon } from '@mui/material'
import RequiredIcon from '@/public/images/messages/required.svg'
import ImageFallback from '@/components/common/ImageFallback'
import txTypeCss from '@/components/transactions/TxType/styles.module.css'
import { isEIP712TypedData } from '@/utils/safe-messages'

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
    <Box className={txTypeCss.txType}>
      {msg.logoUri ? (
        <ImageFallback
          src={msg.logoUri || FALLBACK_LOGO_URI}
          fallbackSrc={FALLBACK_LOGO_URI}
          alt="Message type"
          width={16}
          height={16}
        />
      ) : (
        <SvgIcon component={RequiredIcon} viewBox="0 0 32 32" fontSize="small" />
      )}
      {getMessageName(msg)}
    </Box>
  )
}

export default MsgType
