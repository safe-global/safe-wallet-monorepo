import QRCodeReact from 'qrcode.react'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactElement } from 'react'

const QR_LOGO_SIZE = 20

export type QRCodeViewProps = {
  value?: string
  size: number
  bgColor: string
  fgColor: string
}

export function QRCodeView({ value, size, bgColor, fgColor }: QRCodeViewProps): ReactElement {
  return value ? (
    <QRCodeReact
      value={value}
      size={size}
      role="img"
      aria-label="QR code"
      bgColor={bgColor}
      fgColor={fgColor}
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
