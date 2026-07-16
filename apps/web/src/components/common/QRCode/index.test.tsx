import { render, screen } from '@/tests/test-utils'
import QRCode from './index'

jest.mock('@/hooks/useDarkMode', () => ({
  __esModule: true,
  useDarkMode: () => false,
}))

jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: ({
    size,
    imageSettings,
    bgColor: _bgColor,
    fgColor: _fgColor,
    value: _value,
    ...props
  }: {
    size: number
    imageSettings: { src: string }
    bgColor: string
    fgColor: string
    value: string
  }) => <canvas data-image-src={imageSettings.src} data-size={size} {...props} />,
}))

describe('QRCode', () => {
  it('exposes the generated code as a named image', () => {
    render(<QRCode value="0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552" size={150} />)

    expect(screen.getByRole('img', { name: 'QR code' })).toHaveAttribute('data-size', '150')
  })
})
