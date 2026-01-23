import { SettingsInfoType } from '@safe-global/store/gateway/types'
import type { TransactionDetails, SwapOwner } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render } from '@/tests/test-utils'
import SettingsChange from '.'
import { ownerAddress, txInfo } from './mockData'
import { SettingsChangeContext } from '@/features/tx-flow/components/flows/AddOwner/context'
import { type AddOwnerFlowProps } from '@/features/tx-flow/components/flows/AddOwner'
import { type ReplaceOwnerFlowProps } from '@/features/tx-flow/components/flows/ReplaceOwner'

describe('SettingsChange', () => {
  it('should display the SettingsChange component with owner details', () => {
    const { container, getByText } = render(
      <SettingsChangeContext.Provider value={{} as AddOwnerFlowProps | ReplaceOwnerFlowProps}>
        <SettingsChange txData={{} as TransactionDetails['txData']} txInfo={txInfo} />
      </SettingsChangeContext.Provider>,
    )

    expect(container).toMatchSnapshot()
    expect(getByText('Add owner')).toBeInTheDocument()
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
