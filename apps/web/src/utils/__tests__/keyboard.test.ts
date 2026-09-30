import type { KeyboardEvent } from 'react'
import { clickOnEnterOrSpace } from '../keyboard'

describe('clickOnEnterOrSpace', () => {
  const createEvent = (key: string, sameTarget = true) => {
    const currentTarget = { click: jest.fn() } as unknown as HTMLElement
    const event = {
      key,
      currentTarget,
      target: sameTarget ? currentTarget : ({} as HTMLElement),
      preventDefault: jest.fn(),
    } as unknown as KeyboardEvent<HTMLElement>
    return { event, currentTarget }
  }

  it('clicks the element on Enter', () => {
    const { event, currentTarget } = createEvent('Enter')

    clickOnEnterOrSpace(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(currentTarget.click).toHaveBeenCalledTimes(1)
  })

  it('clicks the element on Space and prevents page scroll', () => {
    const { event, currentTarget } = createEvent(' ')

    clickOnEnterOrSpace(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(currentTarget.click).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', () => {
    const { event, currentTarget } = createEvent('a')

    clickOnEnterOrSpace(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(currentTarget.click).not.toHaveBeenCalled()
  })

  it('ignores key presses bubbling from child elements', () => {
    const { event, currentTarget } = createEvent('Enter', false)

    clickOnEnterOrSpace(event)

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(currentTarget.click).not.toHaveBeenCalled()
  })
})
