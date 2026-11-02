import userEvent from '@testing-library/user-event'
import { render, waitFor } from '@/tests/test-utils'
import { ImportFileUpload } from '../ImportFileUpload'

const renderUpload = () => {
  const setFileName = jest.fn()
  const setJsonData = jest.fn()
  const { container } = render(<ImportFileUpload setFileName={setFileName} setJsonData={setJsonData} />)
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  return { input, setFileName, setJsonData }
}

describe('ImportFileUpload', () => {
  it('offers a file input that accepts JSON exports', () => {
    const { input } = renderUpload()

    expect(input).toHaveAttribute('accept', expect.stringContaining('application/json'))
  })

  it('passes the name and content of a dropped JSON file', async () => {
    const { input, setFileName, setJsonData } = renderUpload()

    await userEvent.setup().upload(input, new File(['{"version":"3.0"}'], 'data.json', { type: 'application/json' }))

    await waitFor(() => {
      expect(setFileName).toHaveBeenCalledWith('data.json')
      expect(setJsonData).toHaveBeenCalledWith('{"version":"3.0"}')
    })
  })

  it('ignores a dropped file that is not JSON', async () => {
    const { input, setFileName, setJsonData } = renderUpload()
    const user = userEvent.setup({ applyAccept: false })

    await user.upload(input, new File(['address,name,chainId'], 'address-book.csv', { type: 'text/csv' }))
    await user.upload(input, new File(['{}'], 'data.json', { type: 'application/json' }))

    await waitFor(() => expect(setJsonData).toHaveBeenCalled())
    expect(setFileName.mock.calls).toEqual([['data.json']])
    expect(setJsonData.mock.calls).toEqual([['{}']])
  })
})
