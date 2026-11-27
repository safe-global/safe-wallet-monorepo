import userEvent, { type UserEvent } from '@testing-library/user-event'
import { render, screen } from '../test-utils'
import App from '../App'
import { addChecksum } from '../lib/checksum'
import { BatchFile, ContractMethod } from '../typings/models'
import { CHAIN_INFO, SAFE_INFO } from './sdk'

export const TEST_CONTRACT = '0x11AB70A4564C62F567B92868Cb5e69b50c5434aF'

export const SET_ADDRESS_METHOD: ContractMethod = {
  inputs: [{ internalType: 'address', name: 'newValue', type: 'address' }],
  name: 'testAddressValue',
  payable: false,
}

export const renderApp = (): UserEvent => {
  window.history.pushState({}, '', '/')
  const user = userEvent.setup()
  render(<App />)
  return user
}

export const buildBatchFile = (overrides: Partial<BatchFile> = {}): BatchFile =>
  addChecksum({
    version: '1.0',
    chainId: CHAIN_INFO.chainId,
    createdAt: 1702396600164,
    meta: {
      name: 'Transactions Batch',
      description: '',
      createdFromSafeAddress: SAFE_INFO.safeAddress,
      createdFromOwnerAddress: '',
    },
    transactions: [
      {
        to: TEST_CONTRACT,
        value: '0',
        contractMethod: SET_ADDRESS_METHOD,
        contractInputsValues: { newValue: SAFE_INFO.owners[0] },
      },
    ],
    ...overrides,
  })

export const uploadJson = async (user: UserEvent, content: unknown): Promise<void> => {
  await screen.findByText('choose a file')
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!fileInput) throw new Error('The batch upload input is not rendered')

  await user.upload(fileInput, new File([JSON.stringify(content)], 'batch.json', { type: 'application/json' }))
}
