import { useMemo } from 'react'
import { Platform } from 'react-native'
import { useTheme } from 'tamagui'

export const useContactActions = () => {
  const theme = useTheme()
  const color = theme.color?.get()
  const colorError = 'red'

  const actions = useMemo(
    () => [
      {
        id: 'copy',
        title: 'Copy address',
        image: Platform.select({
          ios: 'doc.on.doc',
          android: 'baseline_content_copy_24',
        }),
        imageColor: Platform.select({ ios: color, android: '#000' }),
      },
      {
        id: 'delete',
        title: 'Delete contact',
        attributes: {
          destructive: true,
        },
        image: Platform.select({
          ios: 'trash',
          android: 'baseline_delete_24',
        }),
        imageColor: colorError,
      },
    ],
    [color, colorError],
  )

  return actions
}
