import { TextProps } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { TouchableOpacity } from 'react-native'

interface CopyButtonProps {
  value: string
  color: TextProps['color']
  size?: number
  text?: string
}

export const CopyButton = ({ value, color, size = 13, text }: CopyButtonProps) => {
  const copyAndDispatchToast = useCopyAndDispatchToast(text)
  return (
    <TouchableOpacity
      onPress={() => {
        copyAndDispatchToast(value)
      }}
    >
      <SafeFontIcon name={'copy'} size={size} color={color as string} />
    </TouchableOpacity>
  )
}
