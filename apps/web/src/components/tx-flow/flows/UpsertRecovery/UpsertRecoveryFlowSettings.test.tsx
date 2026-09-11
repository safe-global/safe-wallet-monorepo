import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS, SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { UpsertRecoveryFlowSettings, _validateRecoverer } from './UpsertRecoveryFlowSettings'
import { UpsertRecoveryFlowFields, type UpsertRecoveryFlowProps } from '.'
import { DAY_IN_SECONDS } from './useRecoveryPeriods'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safeAddress: '0x0000000000000000000000000000000000000001' }),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: () => ({ chainId: '1' }),
}))

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShieldForAddressPoisoning: () => undefined,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  __esModule: true,
  useLazySafesGetSafeV1Query: () => [jest.fn()],
}))

jest.mock('@/components/common/AddressBookInput', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('./RecovererSmartContractWarning', () => ({
  __esModule: true,
  RecovererWarning: () => null,
}))

const renderSettings = (data: Partial<UpsertRecoveryFlowProps>) => {
  const context: TxFlowContextType<UpsertRecoveryFlowProps> = {
    ...initialContext,
    data: {
      [UpsertRecoveryFlowFields.recoverer]: '',
      [UpsertRecoveryFlowFields.delay]: '',
      [UpsertRecoveryFlowFields.customDelay]: '',
      [UpsertRecoveryFlowFields.selectedDelay]: '0',
      [UpsertRecoveryFlowFields.expiry]: '0',
      ...data,
    },
  }

  return render(
    <TxFlowContext.Provider value={context as TxFlowContextType}>
      <UpsertRecoveryFlowSettings />
    </TxFlowContext.Provider>,
  )
}

describe('UpsertRecoveryFlowSettings', () => {
  describe('validateRecoverer (WA-3005 Bucket A)', () => {
    const safeAddress = faker.finance.ethereumAddress()

    it('rejects the reserved addresses with Recoverer-specific copy, not the signer copy', () => {
      expect(_validateRecoverer(ZERO_ADDRESS, safeAddress)).toBe('This Recoverer address is not valid')
      expect(_validateRecoverer(SENTINEL_ADDRESS, safeAddress)).toBe('This Recoverer address is not valid')

      // A Recoverer is not a signer, so the shared GS203 copy would be wrong here
      expect(_validateRecoverer(ZERO_ADDRESS, safeAddress)).not.toBe(getContractErrorMessage('GS203'))
    })

    it('rejects the Safe account itself', () => {
      expect(_validateRecoverer(safeAddress, safeAddress)).toBe('The Safe account cannot be a Recoverer of itself')
    })

    it('accepts a valid recoverer', () => {
      expect(_validateRecoverer(faker.finance.ethereumAddress(), safeAddress)).toBeUndefined()
    })
  })

  it('shows the human-readable label in the review window trigger, not the raw seconds value', () => {
    const { getByTestId } = renderSettings({
      [UpsertRecoveryFlowFields.selectedDelay]: `${DAY_IN_SECONDS * 28}`,
    })

    const trigger = getByTestId('recovery-delay-select')
    expect(trigger).toHaveTextContent('28 days')
    expect(trigger).not.toHaveTextContent(`${DAY_IN_SECONDS * 28}`)
  })

  it('shows the human-readable label in the proposal expiry trigger, not the raw seconds value', () => {
    const { getByTestId } = renderSettings({
      [UpsertRecoveryFlowFields.expiry]: `${DAY_IN_SECONDS * 7}`,
    })

    const trigger = getByTestId('recovery-expiry-select')
    expect(trigger).toHaveTextContent('7 days')
    expect(trigger).not.toHaveTextContent(`${DAY_IN_SECONDS * 7}`)
  })
})
