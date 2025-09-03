import { View, Text } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { InfoSheet } from '@/src/components/InfoSheet'
import { shortenText } from '@safe-global/utils/utils/formatters'
import { characterDisplayLimit } from '@/src/features/AdvancedDetails/formatters/singleValue'

interface HexDataDisplayProps {
  /**
   * The hex data to display
   */
  data: string | null | undefined
  /**
   * The title for the info sheet modal
   */
  title: string
  /**
   * The toast message when data is copied
   */
  copyMessage: string
  /**
   * Character limit for shortening the data display (optional, defaults to characterDisplayLimit)
   */
  characterLimit?: number
  /**
   * Color for the copy button (optional, defaults to '$textSecondaryLight')
   */
  copyButtonColor?: string
  /**
   * Gap between text and copy button (optional, defaults to '$1')
   */
  gap?: string
}

/**
 * A reusable component for displaying hex data with shortened view, copy functionality, and expandable info sheet
 */
export const HexDataDisplay = ({
  data,
  title,
  copyMessage,
  characterLimit = characterDisplayLimit,
  copyButtonColor = '$textSecondaryLight',
  gap = '$1',
}: HexDataDisplayProps) => {
  if (!data) {
    return <Text>No data</Text>
  }

  return (
    <InfoSheet title={title} info={data}>
      <View flexDirection="row" alignItems="center" gap={gap}>
        <Text>{shortenText(data, characterLimit)}</Text>
        <CopyButton value={data} color={copyButtonColor} text={copyMessage} />
      </View>
    </InfoSheet>
  )
}
