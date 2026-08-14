import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Textarea } from '@/components/ui/textarea'
import { useMemo } from 'react'
import type { ReactElement } from 'react'

import css from './styles.module.css'

const MAX_ROWS = 10

const Msg = ({ message }: { message: MessageItem['message'] }): ReactElement => {
  const isTextMessage = typeof message === 'string'

  const readableData = useMemo(() => {
    return isTextMessage ? message : JSON.stringify(message, null, 2)
  }, [isTextMessage, message])

  return <Textarea rows={MAX_ROWS} value={readableData} readOnly className={css.msg} />
}

export default Msg
