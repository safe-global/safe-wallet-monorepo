import { isBlockChainInteractionDisabled } from '@/utils/utils'

type Props = {
  children: React.ReactNode
  message?: React.ReactNode
}

export const DisableWrapper = ({ children, message }: Props) => {
  if (isBlockChainInteractionDisabled()) {
    if (message) {
      return message
    }
    return null
  }

  return children
}
