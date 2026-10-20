import { screen } from '../test-utils'
import { buildBatchFile, renderApp, uploadJson } from '../test/app'

jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('../test/sdk').safeAppsReactSdkFake)

describe('Uploading a batch file', () => {
  it('loads the transactions of a batch from this chain', async () => {
    const user = renderApp()

    await uploadJson(user, buildBatchFile())

    expect(await screen.findByText('testAddressValue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Batch' })).toBeEnabled()
  })

  it('warns that a batch comes from another chain', async () => {
    const user = renderApp()

    await uploadJson(user, buildBatchFile({ chainId: '1' }))

    expect(await screen.findByText('This batch is from another Chain (1)!')).toBeInTheDocument()
  })

  it('warns that a batch was changed after it was saved', async () => {
    const batchFile = buildBatchFile()
    const user = renderApp()

    await uploadJson(user, { ...batchFile, transactions: [{ ...batchFile.transactions[0], value: '1' }] })

    expect(
      await screen.findByText('This batch contains some changed properties since you saved or downloaded it'),
    ).toBeInTheDocument()
  })

  it.each([
    { file: 'an invalid batch', content: { test: 'I am not a valid batch' } },
    { file: 'an empty batch', content: {} },
  ])('loads no transactions from $file', async ({ content }) => {
    const user = renderApp()

    await uploadJson(user, content)

    expect(screen.getByText('choose a file')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create Batch' })).not.toBeInTheDocument()
  })
})
