import { render, screen } from '@/tests/test-utils'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SafeSetupOverview } from '@/components/new-safe/create/steps/ReviewStep/index'

const COSIGNER = '0xC051Ec0000000000000000000000000000000001'
const OWNER = '0x1234567890abcdef1234567890abcdef12345678'

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({
    CloudCosignerBadge: () => <span data-testid="cloud-cosigner-badge">Cloud cosigner</span>,
  }),
}))

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <span>{address}</span>,
}))

const chain = { chainId: '1', chainName: 'Ethereum' } as Chain

describe('SafeSetupOverview', () => {
  it('labels the cloud cosigner among the signers and counts it in the threshold', () => {
    render(
      <SafeSetupOverview
        name="Treasury"
        owners={[
          { name: 'Alice', address: OWNER },
          { name: 'Cloud cosigner', address: COSIGNER },
        ]}
        threshold={2}
        networks={[chain]}
        cloudCosignerAddress={COSIGNER}
      />,
    )

    expect(screen.getAllByTestId('cloud-cosigner-badge')).toHaveLength(1)
    expect(screen.getByTestId('review-step-owner-info')).toHaveTextContent(COSIGNER)
    expect(screen.getByTestId('review-step-threshold')).toHaveTextContent('2 out of 2')
  })

  it('shows no badge when the cosigner was not added', () => {
    render(
      <SafeSetupOverview
        name="Treasury"
        owners={[{ name: 'Alice', address: OWNER }]}
        threshold={1}
        networks={[chain]}
      />,
    )

    expect(screen.queryByTestId('cloud-cosigner-badge')).not.toBeInTheDocument()
  })
})
