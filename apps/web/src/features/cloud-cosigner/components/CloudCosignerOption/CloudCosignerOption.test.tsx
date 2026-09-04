import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { render, screen, fireEvent } from '@/tests/test-utils'
import CloudCosignerOption from '.'
import { useCloudCosignerInfo } from '../../hooks/useCloudCosignerInfo'

jest.mock('../../hooks/useCloudCosignerInfo')

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <span>{address}</span>,
}))

const mockUseCloudCosignerInfo = useCloudCosignerInfo as jest.MockedFunction<typeof useCloudCosignerInfo>

const cosignerAddress = checksumAddress(faker.finance.ethereumAddress())
const available = {
  isAvailable: true,
  address: cosignerAddress,
  defaultPolicy: { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null },
  isLoading: false,
  error: undefined,
}

describe('CloudCosignerOption', () => {
  it('renders nothing when the feature is unavailable', () => {
    mockUseCloudCosignerInfo.mockReturnValue({ ...available, isAvailable: false, address: undefined })

    const { container } = render(<CloudCosignerOption checked={false} onCheckedChange={jest.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows a skeleton while the address loads', () => {
    mockUseCloudCosignerInfo.mockReturnValue({ ...available, address: undefined, isLoading: true })

    render(<CloudCosignerOption checked={false} onCheckedChange={jest.fn()} />)

    expect(screen.getByTestId('cloud-cosigner-option-loading')).toBeInTheDocument()
  })

  it('shows a warning when the service errors', () => {
    mockUseCloudCosignerInfo.mockReturnValue({ ...available, address: undefined, error: new Error('down') })

    render(<CloudCosignerOption checked={false} onCheckedChange={jest.fn()} />)

    expect(screen.getByTestId('cloud-cosigner-option-error')).toHaveTextContent('currently unavailable')
  })

  it('reports the cosigner address when toggled on', () => {
    mockUseCloudCosignerInfo.mockReturnValue(available)
    const onCheckedChange = jest.fn()

    render(<CloudCosignerOption checked={false} onCheckedChange={onCheckedChange} />)

    fireEvent.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).toHaveBeenCalledWith(true, cosignerAddress)
    expect(screen.queryByTestId('cloud-cosigner-option-address')).not.toBeInTheDocument()
  })

  it('shows the address once checked and reports unchecking', () => {
    mockUseCloudCosignerInfo.mockReturnValue(available)
    const onCheckedChange = jest.fn()

    render(<CloudCosignerOption checked onCheckedChange={onCheckedChange} />)

    expect(screen.getByTestId('cloud-cosigner-option-address')).toHaveTextContent(cosignerAddress)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenCalledWith(false, cosignerAddress)
  })
})
