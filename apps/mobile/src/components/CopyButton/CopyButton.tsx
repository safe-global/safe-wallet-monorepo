import { Button, TextProps } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'

interface CopyButtonProps {
  value: string
  color: TextProps['color']
  size?: number
}

export const CopyButton = ({ value, color, size = 13 }: CopyButtonProps) => {
  const copyAndDispatchToast = useCopyAndDispatchToast()
  return (
    <Button
      onPress={() => {
        copyAndDispatchToast(value)
      }}
      height={20}
      backgroundColor={'transparent'}
    >
      <SafeFontIcon name={'copy'} size={size} color={color as string} />
    </Button>
  )
}
