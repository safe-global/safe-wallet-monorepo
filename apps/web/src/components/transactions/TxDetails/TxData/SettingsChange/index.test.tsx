import { SettingsInfoType } from '@safe-global/store/gateway/types'
import { fakerChecksummedAddress, render } from '@/tests/test-utils'
import SettingsChangeTxInfo from '.'

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
})
