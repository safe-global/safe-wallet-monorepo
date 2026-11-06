import { faker } from '@faker-js/faker'
import { render, screen, waitFor, within } from '@testing-library/react'
import { encodeFunctionData, erc20Abi, getAddress, parseGwei, parseUnits } from 'viem'
import App from './App'
import { renderApp } from './test/app'
import { erc20Balance, nativeBalance } from './test/balances'
import { fakeSdk, registerEnsName } from './test/sdk'

jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('./test/sdk').safeAppsReactSdkFake)

const newAddress = () => getAddress(faker.finance.ethereumAddress())
const sentTxs = () => fakeSdk.txs.send.mock.calls[0][0].txs
const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1].textContent)

describe('Drain Account', () => {
  it('sends one transfer per asset to the recipient when everything is selected', async () => {
    const recipient = newAddress()
    const ether = nativeBalance({ amount: '1.5' })
    const token = erc20Balance({ amount: '300' })
    const user = renderApp([ether, token])

    await user.type(await screen.findByLabelText('Recipient'), recipient)
    await user.click(screen.getByRole('button', { name: 'Transfer everything' }))

    await waitFor(() => expect(fakeSdk.txs.send).toHaveBeenCalledTimes(1))
    expect(sentTxs()).toEqual([
      { to: recipient, value: '1500000000000000000', data: '0x' },
      {
        to: token.tokenInfo.address,
        value: '0',
        data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [recipient, parseUnits('300', 6)] }),
      },
    ])
  })

  it('sends transfers only for the selected assets', async () => {
    const recipient = newAddress()
    const ether = nativeBalance()
    const dai = erc20Balance({ name: 'Dai' })
    const user = renderApp([ether, dai])

    await user.click(await screen.findByLabelText('Select Ether'))
    await user.type(screen.getByLabelText('Recipient'), recipient)
    await user.click(screen.getByRole('button', { name: 'Transfer 1 asset' }))

    await waitFor(() => expect(fakeSdk.txs.send).toHaveBeenCalledTimes(1))
    expect(sentTxs()).toEqual([expect.objectContaining({ to: dai.tokenInfo.address })])
  })

  it('resolves an ENS name to the recipient address', async () => {
    const recipient = newAddress()
    registerEnsName('drain-recipient.eth', recipient)
    const user = renderApp([nativeBalance()])

    await user.type(await screen.findByLabelText('Recipient'), 'drain-recipient.eth')
    await user.click(screen.getByRole('button', { name: 'Transfer everything' }))

    await waitFor(() => expect(fakeSdk.txs.send).toHaveBeenCalledTimes(1))
    expect(sentTxs()).toEqual([expect.objectContaining({ to: recipient })])
  })

  it.each([
    ['is empty', ''],
    ['is not a full address', '0xb3b83bf204C458B46'],
    ['is an ENS name that does not resolve', 'nobody.eth'],
  ])('asks for a valid recipient when the recipient %s', async (_, input) => {
    const user = renderApp([nativeBalance()])

    if (input) await user.type(await screen.findByLabelText('Recipient'), input)
    await user.click(await screen.findByRole('button', { name: 'Transfer everything' }))

    expect(await screen.findByText('Please enter a valid recipient address')).toBeInTheDocument()
    expect(fakeSdk.txs.send).not.toHaveBeenCalled()
  })

  it('disables the transfer when no asset is selected', async () => {
    const user = renderApp([nativeBalance(), erc20Balance()])

    await user.click(await screen.findByLabelText('Select all assets'))

    expect(screen.getByRole('button', { name: 'No tokens selected' })).toBeDisabled()
  })

  it('keeps the recipient and the selection when the wallet rejects the transactions', async () => {
    const recipient = newAddress()
    fakeSdk.txs.send.mockRejectedValue(new Error('User rejected the transaction'))
    const user = renderApp([nativeBalance(), erc20Balance({ name: 'Dai' })])

    await user.click(await screen.findByLabelText('Select Dai'))
    await user.type(screen.getByLabelText('Recipient'), recipient)
    await user.click(screen.getByRole('button', { name: 'Transfer 1 asset' }))

    expect(await screen.findByText('Failed sending transactions: User rejected the transaction')).toBeInTheDocument()
    expect(screen.getByLabelText('Recipient')).toHaveValue(recipient)
    expect(screen.getByRole('button', { name: 'Transfer 1 asset' })).toBeEnabled()
  })

  it('clears the form and confirms after the transactions are sent', async () => {
    const user = renderApp([nativeBalance(), erc20Balance({ name: 'Dai' })])

    await user.click(await screen.findByLabelText('Select Dai'))
    await user.type(screen.getByLabelText('Recipient'), newAddress())
    await user.click(screen.getByRole('button', { name: 'Transfer 1 asset' }))

    expect(await screen.findByText(/The transaction has been created/)).toBeInTheDocument()
    expect(screen.getByLabelText('Recipient')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Transfer everything' })).toBeEnabled()
  })

  it('hides the native token when it has no fiat value', async () => {
    renderApp([nativeBalance({ fiatBalance: '0.00000' }), erc20Balance({ name: 'Dai' })])

    expect(await screen.findByText('Dai')).toBeInTheDocument()
    expect(screen.queryByText('Ether')).not.toBeInTheDocument()
  })

  it('warns when a transfer costs more than the asset is worth', async () => {
    fakeSdk.eth.getGasPrice.mockResolvedValue(parseGwei('100').toString())
    fakeSdk.eth.getEstimateGas.mockResolvedValue(21000)
    renderApp([
      nativeBalance({ fiatConversion: '2000', fiatBalance: '2000' }),
      erc20Balance({ name: 'Dust', fiatBalance: '1' }),
    ])

    const dustRow = (await screen.findByText('Dust')).closest('tr') as HTMLElement
    const etherRow = screen.getByText('Ether').closest('tr') as HTMLElement

    expect(await within(dustRow).findByLabelText(/Estimated transfer cost: \$4\.20/)).toBeInTheDocument()
    expect(within(etherRow).queryByLabelText(/Estimated transfer cost/)).not.toBeInTheDocument()
  })

  it('sorts the assets by name, descending first, then ascending', async () => {
    const user = renderApp([erc20Balance({ name: 'Maker' }), erc20Balance({ name: 'Uniswap' }), nativeBalance()])
    await screen.findByText('Maker')

    await user.click(screen.getByRole('button', { name: 'Asset' }))
    expect(rowNames()).toEqual(['Uniswap', 'Maker', 'Ether'])

    await user.click(screen.getByRole('button', { name: 'Asset' }))
    expect(rowNames()).toEqual(['Ether', 'Maker', 'Uniswap'])
  })

  it('sorts the assets by fiat value', async () => {
    const user = renderApp([
      erc20Balance({ name: 'Cheap', fiatBalance: '5' }),
      erc20Balance({ name: 'Pricey', fiatBalance: '500' }),
      erc20Balance({ name: 'Middle', fiatBalance: '50' }),
    ])
    await screen.findByText('Cheap')

    await user.click(screen.getByRole('button', { name: 'Value' }))

    expect(rowNames()).toEqual(['Pricey', 'Middle', 'Cheap'])
  })

  it('shows the error when the balances cannot be loaded', async () => {
    fakeSdk.safe.experimental_getBalances.mockRejectedValue(new Error('Gateway unavailable'))
    render(<App />)

    expect(await screen.findByText('Failed fetching balances: Gateway unavailable')).toBeInTheDocument()
  })

  it('says so when the Safe has no transferable assets', async () => {
    renderApp([nativeBalance({ fiatBalance: '0' })])

    expect(await screen.findByText("You don't have any transferable assets")).toBeInTheDocument()
  })
})
