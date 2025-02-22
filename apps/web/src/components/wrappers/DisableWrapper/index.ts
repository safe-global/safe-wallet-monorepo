import { DISABLE_BLOCKCHAIN_INTERACTION } from '@/config/constants'

type Props = {
  children: React.ReactNode
  message?: React.ReactNode
}
export const DisableWrapper = ({ children, message }: Props) => {
  if (DISABLE_BLOCKCHAIN_INTERACTION) {
    if (message) {
      return message
    }
    return null
  }

  return children
}
