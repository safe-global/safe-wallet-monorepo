import { render } from '@/tests/test-utils'
import { ImportFileUpload } from '../ImportFileUpload'

describe('ImportFileUpload', () => {
  it('offers a file input that accepts JSON exports', () => {
    const { container } = render(<ImportFileUpload setFileName={jest.fn()} setJsonData={jest.fn()} />)

    const input = container.querySelector('input[type="file"]')

    expect(input).toHaveAttribute('accept', expect.stringContaining('application/json'))
  })
})
