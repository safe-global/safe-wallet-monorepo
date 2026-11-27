import { SettingsInfoType } from '@safe-global/store/gateway/types'
import type { SettingsChangeTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { fakerChecksummedAddress, render } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import SettingsChangeTxInfo from '.'

const guard = fakerChecksummedAddress()
const safe = extendedSafeInfoBuilder()
  .with({ guard: { value: guard } })
  .build()
const withGuard = { initialReduxState: { safeInfo: { data: safe, loaded: true, loading: false } } }
const deleteGuard = { type: SettingsInfoType.DELETE_GUARD } as const

describe('SettingsChangeTxInfo', () => {
  it('shows the module guard that the transaction sets', () => {
    const moduleGuard = fakerChecksummedAddress()
    const { getByText } = render(
      <SettingsChangeTxInfo
        settingsInfo={{ type: SettingsInfoType.SET_MODULE_GUARD, moduleGuard: { value: moduleGuard } }}
      />,
    )

    expect(getByText('Set module guard:')).toBeInTheDocument()
    expect(getByText(moduleGuard)).toBeInTheDocument()
  })

  it('shows that the transaction deletes the module guard', () => {
    const { getByText } = render(<SettingsChangeTxInfo settingsInfo={{ type: SettingsInfoType.DELETE_MODULE_GUARD }} />)

    expect(getByText('Delete module guard')).toBeInTheDocument()
  })

  it.each([undefined, 'AWAITING_CONFIRMATIONS', 'AWAITING_EXECUTION'] as const)(
    'shows the guard that a queued transaction of this Safe deletes (status %s)',
    (txStatus) => {
      const { getByText } = render(
        <SettingsChangeTxInfo settingsInfo={deleteGuard} txStatus={txStatus} safeAddress={safe.address.value} />,
        withGuard,
      )

      expect(getByText('Delete guard:')).toBeInTheDocument()
      expect(getByText(guard)).toBeInTheDocument()
    },
  )

  it.each(['SUCCESS', 'FAILED', 'CANCELLED'] as const)(
    'shows no guard address for a %s transaction, whose removed guard is unknown',
    (txStatus) => {
      const { getByText, queryByText } = render(
        <SettingsChangeTxInfo settingsInfo={deleteGuard} txStatus={txStatus} />,
        withGuard,
      )

      expect(getByText('Delete guard')).toBeInTheDocument()
      expect(queryByText(guard)).not.toBeInTheDocument()
    },
  )

  it("shows no guard address for another Safe's transaction, such as a nested Safe's", () => {
    const { getByText, queryByText } = render(
      <SettingsChangeTxInfo settingsInfo={deleteGuard} safeAddress={fakerChecksummedAddress()} />,
      withGuard,
    )

    expect(getByText('Delete guard')).toBeInTheDocument()
    expect(queryByText(guard)).not.toBeInTheDocument()
  })

  it('renders nothing for a settings type it does not know', () => {
    const unknown = { type: 'SET_SOMETHING_NEW' } as unknown as SettingsChangeTransaction['settingsInfo']

    const { container } = render(<SettingsChangeTxInfo settingsInfo={unknown} />)

    expect(container).toBeEmptyDOMElement()
  })
})
