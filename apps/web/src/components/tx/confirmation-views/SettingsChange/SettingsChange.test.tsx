import { render } from '@/tests/test-utils'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { SettingsInfoType } from '@safe-global/safe-gateway-typescript-sdk'
import SettingsChange from '.'
import { ownerAddress, txInfo } from './mockData'
import { SettingsChangeContext } from '@/components/tx-flow/flows/AddOwner/context'
import { type AddOwnerFlowProps } from '@/components/tx-flow/flows/AddOwner'
import { type ReplaceOwnerFlowProps } from '@/components/tx-flow/flows/ReplaceOwner'
import { type SwapOwner } from '@safe-global/safe-apps-sdk'

describe('SettingsChange', () => {
  it('should display the SettingsChange component with owner details', () => {
    const { container, getByText } = render(
      <SettingsChangeContext.Provider value={{} as AddOwnerFlowProps | ReplaceOwnerFlowProps}>
        <SettingsChange txData={{} as TransactionDetails['txData']} txInfo={txInfo} />
      </SettingsChangeContext.Provider>,
    )

    expect(container).toMatchSnapshot()
    expect(getByText('New signer')).toBeInTheDocument()
    expect(getByText(ownerAddress)).toBeInTheDocument()
  })

  it('should display the SettingsChange component with newOwner details', () => {
    const newOwnerAddress = '0x0000000000000000'
    const contextValue = {
      newOwner: {
        address: newOwnerAddress,
        name: 'Alice',
      },
    }
    const { container, getByText } = render(
      <SettingsChangeContext.Provider value={contextValue as AddOwnerFlowProps | ReplaceOwnerFlowProps}>
        <SettingsChange
          txData={{} as TransactionDetails['txData']}
          txInfo={{
            ...txInfo,
            settingsInfo: {
              type: SettingsInfoType.SWAP_OWNER,
              oldOwner: {
                value: ownerAddress,
                name: 'Bob',
                logoUri: 'http://bob.com',
              },
            } as SwapOwner,
          }}
        />
      </SettingsChangeContext.Provider>,
    )

    expect(container).toMatchSnapshot()
    expect(getByText('Previous signer')).toBeInTheDocument()
    expect(getByText(newOwnerAddress)).toBeInTheDocument()
  })
})
