import { renderWithUserEvent, screen } from '@/tests/test-utils'
import DataManagement from '..'

describe('DataManagement export button', () => {
  afterEach(() => jest.restoreAllMocks())

  it('downloads the dated export file when it is clicked', async () => {
    window.URL.createObjectURL = jest.fn<string, [Blob]>(() => 'blob:export')
    const downloads: string[] = []
    jest.spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
      return true
    })
    const { user } = renderWithUserEvent(<DataManagement />)

    await user.click(screen.getByRole('button', { name: 'Export data' }))

    expect(downloads).toEqual([`safe-${new Date().toISOString().slice(0, 10)}.json`])
  })
})
