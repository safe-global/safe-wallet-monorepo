import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import type { TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { useCloudCosignerInfo } from '@/features/cloud-cosigner'
import type { CloudCosignerOptionProps } from '@/features/cloud-cosigner'
import { SignersStructure } from './SignersStructure'
import type { ManageSignersForm } from '.'

const COSIGNER = '0xC051Ec0000000000000000000000000000000001'
const OWNER = '0x1234567890abcdef1234567890abcdef12345678'

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({
    CloudCosignerOption: ({ checked, onCheckedChange }: CloudCosignerOptionProps) => (
      <input
        type="checkbox"
        data-testid="cloud-cosigner-option"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked, COSIGNER)}
      />
    ),
  }),
}))

jest.mock('@/features/cloud-cosigner', () => ({
  ...jest.requireActual('@/features/cloud-cosigner'),
  useCloudCosignerInfo: jest.fn(),
}))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShieldForAddressPoisoning: jest.fn(),
}))

jest.mock('@/components/new-safe/OwnerRow', () => ({
  __esModule: true,
  default: ({ index }: { index: number }) => <div data-testid="owner-row">{index}</div>,
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseCloudCosignerInfo = useCloudCosignerInfo as jest.MockedFunction<typeof useCloudCosignerInfo>

const renderStructure = () => {
  const data: ManageSignersForm = { threshold: 1, owners: [{ name: '', address: OWNER }] }
  const value = { ...initialContext, data } as unknown as TxFlowContextType<ManageSignersForm>
  return render(
    <TxFlowContext.Provider value={value}>
      <SignersStructure />
    </TxFlowContext.Provider>,
  )
}

describe('SignersStructure', () => {
  beforeEach(() => {
    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ chainId: '1', owners: [{ value: OWNER }], threshold: 1 })
        .build(),
      safeAddress: '0x0000000000000000000000000000000000000001',
      safeLoaded: true,
      safeLoading: false,
    })
    mockUseCloudCosignerInfo.mockReturnValue({
      isAvailable: true,
      address: COSIGNER,
      defaultPolicy: undefined,
      isLoading: false,
      error: undefined,
    })
  })

  it('adds the cosigner as an owner and raises the threshold when toggled on', async () => {
    renderStructure()

    expect(screen.getAllByTestId('owner-row')).toHaveLength(1)
    expect(screen.getByTestId('cloud-cosigner-option')).not.toBeChecked()

    fireEvent.click(screen.getByTestId('cloud-cosigner-option'))

    await waitFor(() => expect(screen.getAllByTestId('owner-row')).toHaveLength(2))
    expect(screen.getByTestId('cloud-cosigner-option')).toBeChecked()
    expect(screen.getByTestId('threshold-selector')).toHaveTextContent('2')
    expect(screen.getByText(/out of 2 signers/)).toBeInTheDocument()
  })

  it('removes the cosigner owner and lowers the threshold when toggled off', async () => {
    renderStructure()

    fireEvent.click(screen.getByTestId('cloud-cosigner-option'))
    await waitFor(() => expect(screen.getAllByTestId('owner-row')).toHaveLength(2))

    fireEvent.click(screen.getByTestId('cloud-cosigner-option'))

    await waitFor(() => expect(screen.getAllByTestId('owner-row')).toHaveLength(1))
    expect(screen.getByTestId('threshold-selector')).toHaveTextContent('1')
  })
})
