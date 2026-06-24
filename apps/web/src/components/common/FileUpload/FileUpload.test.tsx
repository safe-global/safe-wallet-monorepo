import { render, fireEvent } from '@/tests/test-utils'
import FileUpload, { FileTypes, type FileInfo } from './index'

const getRootProps = <T,>(props?: T): T => (props ?? {}) as T
const onRemove = jest.fn()

const renderUpload = (fileInfo?: FileInfo) =>
  render(<FileUpload fileType={FileTypes.CSV} getRootProps={getRootProps} onRemove={onRemove} fileInfo={fileInfo} />)

describe('FileUpload', () => {
  beforeEach(() => onRemove.mockClear())

  it('renders the dropzone prompt when no file is selected', () => {
    const { getByTestId, getByText } = renderUpload()

    expect(getByTestId('file-upload-section')).toBeInTheDocument()
    expect(getByText(/Drag and drop a CSV file/)).toBeInTheDocument()
  })

  it('calls onRemove when the remove button is clicked', () => {
    const { getByRole } = renderUpload({ name: 'address-book.csv', summary: [] })

    fireEvent.click(getByRole('button'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('shows the connector line and summary when there are summary rows', () => {
    const { getByTestId, getByText } = renderUpload({
      name: 'address-book.csv',
      additionalInfo: '1 KB',
      summary: [<span key="s">Found 3 entries on 1 chain</span>],
    })

    expect(getByText('Found 3 entries on 1 chain')).toBeInTheDocument()
    expect(getByTestId('file-upload-connector')).toBeInTheDocument()
  })

  it('hides the connector line and summary when entries are invalid (empty summary, no error)', () => {
    const { queryByTestId, queryByText } = renderUpload({
      name: 'address-book.csv',
      additionalInfo: '1 KB',
      summary: [],
    })

    expect(queryByText(/Found .* entries/)).not.toBeInTheDocument()
    expect(queryByTestId('file-upload-connector')).not.toBeInTheDocument()
  })

  it('shows the connector line when there is an error but no summary rows', () => {
    const { getByTestId, getByText } = renderUpload({
      name: 'address-book.csv',
      summary: [],
      error: 'Invalid file',
    })

    expect(getByText('Invalid file')).toBeInTheDocument()
    expect(getByTestId('file-upload-connector')).toBeInTheDocument()
  })
})
