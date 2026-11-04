import type { UserEvent } from '@testing-library/user-event'
import { screen } from '../test-utils'
import { buildBatchFile, renderApp, uploadJson } from '../test/app'
import { BatchFile } from '../typings/models'

jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('../test/sdk').safeAppsReactSdkFake)

const BATCH_NAME = 'Monthly payroll'

const saveToLibrary = async (user: UserEvent) => {
  await uploadJson(user, buildBatchFile())
  await user.click(await screen.findByRole('button', { name: 'Save to Library' }))
  await user.type(screen.getByLabelText(/^Batch name/), BATCH_NAME)
  await user.click(screen.getByRole('button', { name: 'Create' }))
  await user.click(await screen.findByRole('link', { name: '(1) Your transaction library' }))
}

const downloadedBatch = async (createObjectURL: jest.Mock): Promise<BatchFile> => {
  const blob: Blob = createObjectURL.mock.lastCall?.[0]
  return JSON.parse(await blob.text())
}

describe('<TransactionLibrary>', () => {
  const createObjectURL = jest.fn(() => 'blob:batch')

  beforeEach(() => {
    localStorage.clear()
    URL.createObjectURL = createObjectURL
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  it('lists a saved batch and downloads it as a batch file', async () => {
    const user = renderApp()
    await saveToLibrary(user)

    await user.click(await screen.findByRole('button', { name: 'Download batch' }))

    expect(screen.getByText(BATCH_NAME)).toBeInTheDocument()
    expect(await downloadedBatch(createObjectURL)).toMatchObject({
      meta: { name: BATCH_NAME },
      transactions: buildBatchFile().transactions,
    })
  })

  it('shows the empty library after the last batch is deleted', async () => {
    const user = renderApp()
    await saveToLibrary(user)

    await user.click(await screen.findByRole('button', { name: 'Delete Batch' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText("You don't have any saved batches.")).toBeInTheDocument()
    expect(screen.queryByText(BATCH_NAME)).not.toBeInTheDocument()
  })
})
