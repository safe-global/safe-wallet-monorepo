import userEvent from '@testing-library/user-event'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import * as useSafeAddressModule from '@/hooks/useSafeAddress'
import QrModal from './QrModal'

// jsdom has no canvas, so the QR code shows the value it encodes as an attribute
jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <canvas role="img" aria-label="QR code" data-value={value} />,
}))

const SAFE_ADDRESS = fakerChecksummedAddress()
const CHAIN = chainBuilder().with({ chainId: '11155111', chainName: 'Sepolia', shortName: 'sep' }).build()

const renderQrModal = () => {
  jest.spyOn(useSafeAddressModule, 'default').mockReturnValue(SAFE_ADDRESS)
  jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(CHAIN)
  const onClose = jest.fn()
  render(<QrModal onClose={onClose} />)
  return { onClose }
}

describe('QrModal', () => {
  afterEach(() => jest.restoreAllMocks())

  it('shows the Safe address in a QR code and warns that only this network is supported', async () => {
    renderQrModal()

    expect(await screen.findByRole('img', { name: 'QR code' })).toHaveAttribute('data-value', SAFE_ADDRESS)
    expect(screen.getByText(/Sepolia only/)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent(SAFE_ADDRESS)
  })

  it('adds the chain prefix to the QR code when the switch is turned on', async () => {
    renderQrModal()
    const qrCode = await screen.findByRole('img', { name: 'QR code' })

    await userEvent.click(screen.getByRole('switch', { name: /^QR code with chain prefix/ }))

    expect(qrCode).toHaveAttribute('data-value', `sep:${SAFE_ADDRESS}`)
  })

  it('calls onClose when the dialog is closed', async () => {
    const { onClose } = renderQrModal()

    await userEvent.click(await screen.findByRole('button', { name: 'close' }))

    expect(onClose).toHaveBeenCalled()
  })
})
