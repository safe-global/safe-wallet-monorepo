import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { NewSafeFormData } from '@/components/new-safe/create'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { CloudCosignerOptionProps } from '@/features/cloud-cosigner'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import type { SafeVersion } from '@safe-global/types-kit'
import OwnerPolicyStep from '.'

const COSIGNER = '0xC051Ec0000000000000000000000000000000001'
const OWNER = '0x1234567890abcdef1234567890abcdef12345678'

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

jest.mock('@/components/new-safe/OwnerRow', () => ({
  __esModule: true,
  default: ({ index }: { index: number }) => <div data-testid="owner-row">{index}</div>,
}))

jest.mock('@/components/new-safe/create/useSyncSafeCreationStep', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const chain = { chainId: '1', chainName: 'Ethereum' } as Chain

const data: NewSafeFormData = {
  name: 'Treasury',
  networks: [chain],
  threshold: 1,
  owners: [{ name: 'Alice', address: OWNER }],
  safeVersion: LATEST_SAFE_VERSION as SafeVersion,
}

describe('OwnerPolicyStep', () => {
  it('submits without a cosigner by default', async () => {
    const onSubmit = jest.fn()

    render(
      <OwnerPolicyStep
        data={data}
        onSubmit={onSubmit}
        onBack={jest.fn()}
        setStep={jest.fn()}
        setDynamicHint={jest.fn()}
      />,
    )

    expect(screen.queryByTestId('cloud-cosigner-threshold-hint')).not.toBeInTheDocument()
    fireEvent.submit(screen.getByTestId('owner-policy-step-form'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ threshold: 1, cloudCosigner: undefined })
  })

  it('carries the cosigner owner through submit and back', async () => {
    const onSubmit = jest.fn()
    const onBack = jest.fn()

    render(
      <OwnerPolicyStep
        data={data}
        onSubmit={onSubmit}
        onBack={onBack}
        setStep={jest.fn()}
        setDynamicHint={jest.fn()}
      />,
    )

    fireEvent.click(screen.getByTestId('cloud-cosigner-option'))

    expect(screen.getByTestId('cloud-cosigner-threshold-hint')).toHaveTextContent('2 out of 2 signers in total')

    fireEvent.click(screen.getByTestId('back-btn'))
    expect(onBack).toHaveBeenCalledWith(
      expect.objectContaining({ cloudCosigner: { name: 'Cloud cosigner', address: COSIGNER } }),
    )

    fireEvent.submit(screen.getByTestId('owner-policy-step-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      threshold: 1,
      cloudCosigner: { name: 'Cloud cosigner', address: COSIGNER },
    })
  })

  it('restores the cosigner choice from the form data', () => {
    render(
      <OwnerPolicyStep
        data={{ ...data, cloudCosigner: { name: 'Cloud cosigner', address: COSIGNER } }}
        onSubmit={jest.fn()}
        onBack={jest.fn()}
        setStep={jest.fn()}
        setDynamicHint={jest.fn()}
      />,
    )

    expect(screen.getByTestId('cloud-cosigner-option')).toBeChecked()
  })
})
