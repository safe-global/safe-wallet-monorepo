import QRCodeReact from 'qrcode.react'
import { lightPalette, darkPalette } from '@safe-global/theme/palettes'
import { Skeleton } from '@/components/ui/skeleton'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { ReactElement } from 'react'

const QR_LOGO_SIZE = 20

const QRCode = ({ value, size }: { value?: string; size: number }): ReactElement => {
  const isDarkMode = useDarkMode()
  const palette = isDarkMode ? darkPalette : lightPalette

  return value ? (
    <QRCodeReact
      value={value}
      size={size}
      role="img"
      aria-label="QR code"
      bgColor={palette.background.paper}
      fgColor={palette.text.primary}
      imageSettings={{
        src: '/images/safe-logo-green.png',
        width: QR_LOGO_SIZE,
        height: QR_LOGO_SIZE,
        excavate: true,
      }}
    />
  ) : (
    <Skeleton className="rounded-none" style={{ width: size, height: size }} />
  )
}

export default QRCode
