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

  it('shows the guard that a pending transaction of this Safe deletes', () => {
    const { getByText } = render(
      <SettingsChangeTxInfo settingsInfo={deleteGuard} safeAddress={safe.address.value} />,
      withGuard,
    )

    expect(getByText('Delete guard:')).toBeInTheDocument()
    expect(getByText(guard)).toBeInTheDocument()
  })

  it('shows no guard address once the transaction is executed, because a later guard may be set', () => {
    const { getByText, queryByText } = render(
      <SettingsChangeTxInfo settingsInfo={deleteGuard} isTxExecuted />,
      withGuard,
    )

    expect(getByText('Delete guard')).toBeInTheDocument()
    expect(queryByText(guard)).not.toBeInTheDocument()
  })

  it("shows no guard address for another Safe's transaction, such as a nested Safe's", () => {
    const { getByText, queryByText } = render(
      <SettingsChangeTxInfo settingsInfo={deleteGuard} safeAddress={fakerChecksummedAddress()} />,
      withGuard,
    )

    expect(getByText('Delete guard')).toBeInTheDocument()
    expect(queryByText(guard)).not.toBeInTheDocument()
  })

  it('renders nothing for a settings type it does not know, instead of an empty card', () => {
    const unknown = { type: 'SET_SOMETHING_NEW' } as unknown as SettingsChangeTransaction['settingsInfo']

    const { container } = render(<SettingsChangeTxInfo settingsInfo={unknown} />)

    expect(container).toBeEmptyDOMElement()
  })
})
