import { TextProps } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { TouchableOpacity } from 'react-native'

interface CopyButtonProps {
  value: string
  color: TextProps['color']
  size?: number
  text?: string
  hitSlop?: number
}

export const CopyButton = ({ value, color, size = 13, text, hitSlop = 0 }: CopyButtonProps) => {
  const copyAndDispatchToast = useCopyAndDispatchToast(text)
  return (
    <TouchableOpacity
      onPress={() => {
        copyAndDispatchToast(value)
      }}
      hitSlop={hitSlop}
    >
      <SafeFontIcon name={'copy'} size={size} color={color as string} />
    </TouchableOpacity>
  )
}
