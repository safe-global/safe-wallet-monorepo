import { render, screen } from '@/tests/test-utils'
import { OwnerList } from '.'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { useCloudCosignerInfo } from '@/features/cloud-cosigner'

const COSIGNER = '0xC051Ec0000000000000000000000000000000001'
const OWNER = '0x1234567890abcdef1234567890abcdef12345678'

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({
    CloudCosignerBadge: () => <span data-testid="cloud-cosigner-badge">Cloud cosigner</span>,
  }),
}))

jest.mock('@/features/cloud-cosigner', () => ({
  ...jest.requireActual('@/features/cloud-cosigner'),
  useCloudCosignerInfo: jest.fn(),
}))

jest.mock('@/components/common/NamedAddressInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <span data-testid="owner-address">{address}</span>,
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => React.ReactNode }) => children(false),
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseCloudCosignerInfo = useCloudCosignerInfo as jest.MockedFunction<typeof useCloudCosignerInfo>

describe('OwnerList', () => {
  beforeEach(() => {
    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ chainId: '1', owners: [{ value: OWNER }, { value: COSIGNER }], threshold: 2 })
        .build(),
      safeAddress: '0x0000000000000000000000000000000000000001',
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('badges only the cloud cosigner owner', () => {
    mockUseCloudCosignerInfo.mockReturnValue({
      isAvailable: true,
      address: COSIGNER,
      defaultPolicy: undefined,
      isLoading: false,
      error: undefined,
    })

    render(<OwnerList />)

    expect(screen.getAllByTestId('owner-address')).toHaveLength(2)
    expect(screen.getAllByTestId('cloud-cosigner-badge')).toHaveLength(1)
    const cosignerRow = screen.getByText(COSIGNER).closest('div')
    expect(cosignerRow).toContainElement(screen.getByTestId('cloud-cosigner-badge'))
  })

  it('shows no badge when the feature is unavailable', () => {
    mockUseCloudCosignerInfo.mockReturnValue({
      isAvailable: false,
      address: undefined,
      defaultPolicy: undefined,
      isLoading: false,
      error: undefined,
    })

    render(<OwnerList />)

    expect(screen.queryByTestId('cloud-cosigner-badge')).not.toBeInTheDocument()
  })
})
