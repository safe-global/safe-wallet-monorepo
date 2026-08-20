import { render, screen } from '@testing-library/react'
import FileUpload, { FileTypes } from '.'

const getRootProps = <T,>(props?: T) => ({ ...props }) as T

// `getRootProps` is spread before the dropzone's own className/style, so anything a consumer tries to
// size the box with through it — the way MUI's <Box> accepted `height` — is silently dropped.
describe('FileUpload', () => {
  it('applies the consumer sizing to the dropzone', () => {
    render(
      <FileUpload fileType={FileTypes.JSON} getRootProps={getRootProps} onRemove={jest.fn()} className="h-[228px]" />,
    )

    expect(screen.getByTestId('file-upload-section')).toHaveClass('h-[228px]')
  })

  it('keeps the dropzone content-sized when no sizing is passed', () => {
    render(<FileUpload fileType={FileTypes.CSV} getRootProps={getRootProps} onRemove={jest.fn()} />)

    expect(screen.getByTestId('file-upload-section').className).not.toMatch(/h-/)
  })
})
