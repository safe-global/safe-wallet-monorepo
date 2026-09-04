import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import CloudCosignerSettings from '.'
import { useCloudCosignerSafeStatus } from '../../hooks/useCloudCosignerSafeStatus'
import { useSignPolicyUpdate } from '../../hooks/useSignPolicyUpdate'
import { useUpdateCloudCosignerPolicyMutation } from '../../store/cloudCosignerApi'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('../../hooks/useCloudCosignerSafeStatus')
jest.mock('../../hooks/useSignPolicyUpdate')
jest.mock('../../store/cloudCosignerApi', () => ({
  ...jest.requireActual('../../store/cloudCosignerApi'),
  useUpdateCloudCosignerPolicyMutation: jest.fn(),
}))
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => React.ReactNode }) => children(true),
}))

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <span>{address}</span>,
}))

jest.mock('@/components/tx-flow/flows', () => ({
  ManageSignersFlow: () => <div>manage signers flow</div>,
}))

const mockUseStatus = useCloudCosignerSafeStatus as jest.MockedFunction<typeof useCloudCosignerSafeStatus>
const mockUseSign = useSignPolicyUpdate as jest.MockedFunction<typeof useSignPolicyUpdate>
const mockUseMutation = useUpdateCloudCosignerPolicyMutation as jest.MockedFunction<
  typeof useUpdateCloudCosignerPolicyMutation
>
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>

const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const cosignerAddress = checksumAddress(faker.finance.ethereumAddress())
const owner = checksumAddress(faker.finance.ethereumAddress())
const policy = { valueThresholdUsd: 100000, reviewUnknownContracts: true, instructions: null }

describe('CloudCosignerSettings', () => {
  const updatePolicy = jest.fn()
  const signPolicy = jest.fn()

  beforeEach(() => {
    updatePolicy.mockReset()
    signPolicy.mockReset()
    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ chainId: '1', address: { value: safeAddress } })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })
    mockUseSign.mockReturnValue(signPolicy)
    updatePolicy.mockReturnValue({ unwrap: () => Promise.resolve(policy) })
    mockUseMutation.mockReturnValue([updatePolicy, { isLoading: false }] as unknown as ReturnType<
      typeof useUpdateCloudCosignerPolicyMutation
    >)
  })

  it('renders nothing when the feature is unavailable', () => {
    mockUseStatus.mockReturnValue({ isAvailable: false, status: undefined, isLoading: false, error: undefined })

    const { container } = render(<CloudCosignerSettings />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows a skeleton while loading', () => {
    mockUseStatus.mockReturnValue({ isAvailable: true, status: undefined, isLoading: true, error: undefined })

    render(<CloudCosignerSettings />)

    expect(screen.getByTestId('cloud-cosigner-settings-loading')).toBeInTheDocument()
  })

  it('offers to manage signers when the cosigner is not an owner', () => {
    mockUseStatus.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      error: undefined,
      status: { cosignerAddress, isEnabled: false, policy, isDefaultPolicy: true },
    })

    render(<CloudCosignerSettings />)

    expect(screen.getByTestId('cloud-cosigner-not-enabled')).toBeInTheDocument()
    expect(screen.getByTestId('cloud-cosigner-manage-signers')).toBeEnabled()
    expect(screen.queryByTestId('cloud-cosigner-policy-form')).not.toBeInTheDocument()
  })

  it('prefills the policy form and keeps save disabled until something changes', () => {
    mockUseStatus.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      error: undefined,
      status: {
        cosignerAddress,
        isEnabled: true,
        policy: { valueThresholdUsd: 50000, reviewUnknownContracts: false, instructions: 'Vendors only.' },
        isDefaultPolicy: false,
      },
    })

    render(<CloudCosignerSettings />)

    expect(screen.getByTestId('cloud-cosigner-threshold')).toHaveValue(50000)
    expect(screen.getByTestId('cloud-cosigner-unknown-contracts')).not.toBeChecked()
    expect(screen.getByTestId('cloud-cosigner-instructions')).toHaveValue('Vendors only.')
    expect(screen.getByTestId('cloud-cosigner-save')).toBeDisabled()
  })

  it('signs and submits the edited policy', async () => {
    mockUseStatus.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      error: undefined,
      status: { cosignerAddress, isEnabled: true, policy, isDefaultPolicy: true },
    })
    signPolicy.mockResolvedValue({ signature: '0xsig', issuedAt: '2026-09-04T10:00:00.000Z', signer: owner })

    render(<CloudCosignerSettings />)

    fireEvent.change(screen.getByTestId('cloud-cosigner-threshold'), { target: { value: '25000' } })
    fireEvent.change(screen.getByTestId('cloud-cosigner-instructions'), { target: { value: 'Payroll only.' } })
    expect(screen.getByTestId('cloud-cosigner-save')).toBeEnabled()
    fireEvent.click(screen.getByTestId('cloud-cosigner-save'))

    const expectedPolicy = { valueThresholdUsd: 25000, reviewUnknownContracts: true, instructions: 'Payroll only.' }
    await waitFor(() => expect(updatePolicy).toHaveBeenCalled())
    expect(signPolicy).toHaveBeenCalledWith({ chainId: '1', safeAddress, policy: expectedPolicy })
    expect(updatePolicy).toHaveBeenCalledWith({
      chainId: '1',
      safeAddress,
      policy: expectedPolicy,
      signer: owner,
      signature: '0xsig',
      issuedAt: '2026-09-04T10:00:00.000Z',
    })
  })

  it('shows the error when signing is rejected', async () => {
    mockUseStatus.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      error: undefined,
      status: { cosignerAddress, isEnabled: true, policy, isDefaultPolicy: true },
    })
    signPolicy.mockRejectedValue(new Error('User rejected the request'))

    render(<CloudCosignerSettings />)

    fireEvent.click(screen.getByTestId('cloud-cosigner-unknown-contracts'))
    fireEvent.click(screen.getByTestId('cloud-cosigner-save'))

    await waitFor(() =>
      expect(screen.getByTestId('cloud-cosigner-save-error')).toHaveTextContent('User rejected the request'),
    )
    expect(updatePolicy).not.toHaveBeenCalled()
  })
})
