import { lightPalette, darkPalette } from '@safe-global/theme/palettes'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { ReactElement } from 'react'
import { QRCodeView } from '@views/components/common/QRCode/QRCodeView'

const QRCode = ({ value, size }: { value?: string; size: number }): ReactElement => {
  const isDarkMode = useDarkMode()
  const palette = isDarkMode ? darkPalette : lightPalette

  return <QRCodeView value={value} size={size} bgColor={palette.background.paper} fgColor={palette.text.primary} />
}

export default QRCode
