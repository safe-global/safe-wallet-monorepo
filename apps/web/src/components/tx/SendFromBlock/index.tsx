import { type ReactElement } from 'react'
import useSafeAddress from '@/hooks/useSafeAddress'
import { SendFromBlockView } from '@views/components/tx/SendFromBlock/SendFromBlockView'

// TODO: Remove this file after replacing in all tx flow components
const SendFromBlock = ({ title }: { title?: string }): ReactElement => {
  const address = useSafeAddress()

  return <SendFromBlockView title={title} address={address} />
}

export default SendFromBlock
