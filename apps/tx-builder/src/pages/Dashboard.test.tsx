import type { UserEvent } from '@testing-library/user-event'
import { screen, within } from '../test-utils'
import { SET_ADDRESS_METHOD, TEST_CONTRACT, renderApp } from '../test/app'
import { SAFE_INFO } from '../test/sdk'
import { serveAbi } from '../test/server'

jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('../test/sdk').safeAppsReactSdkFake)

const SET_BOOLEAN_METHOD = {
  inputs: [{ internalType: 'bool', name: 'newValue', type: 'bool' }],
  name: 'testBooleanValue',
  type: 'function',
  stateMutability: 'nonpayable',
}

const PROXY_ABI = [
  { stateMutability: 'payable', type: 'fallback' },
  { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
]

const typeContractAddress = async (user: UserEvent, address: string) => {
  await user.type(await screen.findByLabelText('Enter Address or ENS Name'), address)
}

const pasteAbi = async (user: UserEvent, abi: unknown[]) => {
  await user.click(await screen.findByLabelText('Enter ABI'))
  await user.paste(JSON.stringify(abi))
}

const addTransaction = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Add new transaction' }))
}

const batchList = () => screen.getByRole('button', { name: 'Create Batch' }).parentElement as HTMLElement

describe('Building a transaction', () => {
  it('flags an address that is not valid', async () => {
    const user = renderApp()

    await typeContractAddress(user, TEST_CONTRACT.slice(5))

    expect(await screen.findByText('The address is not valid')).toBeInTheDocument()
  })

  it('requires a value for a transfer', async () => {
    const user = renderApp()
    await typeContractAddress(user, SAFE_INFO.safeAddress)
    await screen.findByLabelText(/^Value \(ETH\)/)

    await addTransaction(user)

    expect(await screen.findByText('Required')).toBeInTheDocument()
  })

  it('requires the parameters of the contract method', async () => {
    serveAbi([{ ...SET_ADDRESS_METHOD, type: 'function', stateMutability: 'nonpayable' }])
    const user = renderApp()
    await typeContractAddress(user, TEST_CONTRACT)
    await screen.findByLabelText(/^newValue \(address\)/)

    await addTransaction(user)

    expect(await screen.findByText('Required')).toBeInTheDocument()
  })

  it('adds a call to the method picked from the fetched ABI', async () => {
    serveAbi([{ ...SET_ADDRESS_METHOD, type: 'function', stateMutability: 'nonpayable' }, SET_BOOLEAN_METHOD])
    const user = renderApp()
    await typeContractAddress(user, TEST_CONTRACT)

    await user.click(await screen.findByRole('combobox', { name: /contract method selector/i }))
    await user.click(screen.getByRole('option', { name: 'testBooleanValue' }))
    await addTransaction(user)

    expect(await within(batchList()).findByText('testBooleanValue')).toBeInTheDocument()
  })

  it('adds a call from a pasted ABI', async () => {
    const user = renderApp()

    await pasteAbi(user, PROXY_ABI)
    await user.type(await screen.findByRole('combobox', { name: /to address/i }), TEST_CONTRACT)
    await user.type(screen.getByLabelText(/^Value \(ETH\)/), '0')
    await addTransaction(user)

    expect(await within(batchList()).findByText('fallback')).toBeInTheDocument()
  })

  it('does not offer the error types of a pasted ABI as methods', async () => {
    const user = renderApp()

    await pasteAbi(user, [...PROXY_ABI, SET_BOOLEAN_METHOD])
    await user.click(await screen.findByRole('combobox', { name: /contract method selector/i }))

    expect(screen.getByRole('option', { name: 'testBooleanValue' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'AddressEmptyCode' })).not.toBeInTheDocument()
  })

  it('adds a transaction with custom hex data', async () => {
    const user = renderApp()
    await screen.findByLabelText('Enter Address or ENS Name')

    await user.click(screen.getByRole('checkbox'))
    await typeContractAddress(user, TEST_CONTRACT)
    await user.type(await screen.findByLabelText(/^Value \(ETH\)/), '0')
    await user.type(screen.getByLabelText(/^Data \(Hex encoded\)/), '0x')
    await addTransaction(user)

    expect(await within(batchList()).findByText('Custom hex data')).toBeInTheDocument()
  })
})
