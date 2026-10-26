import { render, screen, within, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import type { RecoveryStateItem } from '@/features/recovery'
import { DAY_IN_SECONDS } from '@/components/tx-flow/flows/UpsertRecovery/useRecoveryPeriods'
import recoveryStore from '../../RecoveryContext'
import RecoverySettings from '..'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const delayModifierBuilder = ({
  recoverers,
  delay,
  expiry,
}: {
  recoverers: string[]
  delay: number
  expiry: number
}): RecoveryStateItem => ({
  address: fakerChecksummedAddress(),
  recoverers,
  delay: BigInt(delay),
  expiry: BigInt(expiry),
  txNonce: 0n,
  queueNonce: 0n,
  queue: [],
})

const setRecovery = (delayModifiers: RecoveryStateItem[]) => {
  recoveryStore.setStore({ state: [delayModifiers, undefined, false], pending: {} })
}

describe('RecoverySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it('offers to set up recovery when the Safe has no Delay modifier', () => {
    setRecovery([])

    render(<RecoverySettings />)

    expect(screen.getByTestId('setup-recovery-btn')).toHaveTextContent('Set up recovery')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('lists each recoverer with its review window and proposal expiry', () => {
    const [longRecoverer, shortRecoverer] = [fakerChecksummedAddress(), fakerChecksummedAddress()]
    setRecovery([
      delayModifierBuilder({ recoverers: [longRecoverer], delay: 56 * DAY_IN_SECONDS, expiry: 0 }),
      delayModifierBuilder({ recoverers: [shortRecoverer], delay: 5 * 60, expiry: 60 * 60 }),
    ])

    render(<RecoverySettings />)

    const [, longRow, shortRow] = screen.getAllByRole('row')
    expect(longRow).toHaveTextContent(longRecoverer.slice(-4))
    expect(within(longRow).getByText('56 days')).toBeInTheDocument()
    expect(within(longRow).getByText('never')).toBeInTheDocument()
    expect(shortRow).toHaveTextContent(shortRecoverer.slice(-4))
    expect(within(shortRow).getByText('5 minutes')).toBeInTheDocument()
    expect(within(shortRow).getByText('1 hour')).toBeInTheDocument()
    expect(screen.queryByTestId('setup-recovery-btn')).not.toBeInTheDocument()
  })
})
