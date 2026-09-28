import type { MouseEvent } from 'react'
import { CONTACT_SALES_FORM_URL, openContactSalesForm, openPylonForm } from '../pylonForm'

describe('pylonForm', () => {
  const originalOpen = window.open
  const mockOpen = jest.fn()

  beforeEach(() => {
    mockOpen.mockReset()
    window.open = mockOpen
  })

  afterAll(() => {
    window.open = originalOpen
  })

  const click = (overrides: Partial<MouseEvent<HTMLElement>> = {}) =>
    ({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      preventDefault: jest.fn(),
      ...overrides,
    }) as unknown as MouseEvent<HTMLElement>

  it('opens a form in a small, isolated popup window', () => {
    openPylonForm('https://example.com/form', 400, 600)

    expect(mockOpen).toHaveBeenCalledWith('https://example.com/form', '_blank', expect.stringContaining('popup=yes'))
    const features = mockOpen.mock.calls[0][2]
    expect(features).toContain('width=400')
    expect(features).toContain('height=600')
    expect(features).toContain('noopener')
    expect(features).toContain('noreferrer')
  })

  it('opens the contact-sales form in a popup on a plain click', () => {
    const event = click()
    openContactSalesForm(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockOpen).toHaveBeenCalledWith(CONTACT_SALES_FORM_URL, '_blank', expect.stringContaining('popup=yes'))
  })

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { button: 1 }])(
    'leaves modified clicks to the browser (%o)',
    (overrides) => {
      const event = click(overrides)
      openContactSalesForm(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(mockOpen).not.toHaveBeenCalled()
    },
  )
})
