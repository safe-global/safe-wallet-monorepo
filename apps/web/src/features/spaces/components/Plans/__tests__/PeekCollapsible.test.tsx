import { useRef } from 'react'
import { fireEvent, render, screen } from '@/tests/test-utils'
import PeekCollapsible from '../PeekCollapsible'

const Peek = ({ open, onOpen = jest.fn() }: { open: boolean; onOpen?: () => void }) => {
  const peekRef = useRef<HTMLDivElement>(null)
  return (
    <PeekCollapsible id="peek" open={open} onOpen={onOpen} peekUntil={peekRef} expandLabel="Expand table">
      <div ref={peekRef} data-testid="peek-end" />
      <div>Hidden until open</div>
    </PeekCollapsible>
  )
}

describe('PeekCollapsible', () => {
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(500)
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const bottom = this.dataset.testid === 'peek-end' ? 120 : 500
      return { top: 0, bottom } as DOMRect
    })
  })
  afterEach(() => jest.restoreAllMocks())

  it('clips to the peek element and offers to expand', () => {
    const onOpen = jest.fn()
    render(<Peek open={false} onOpen={onOpen} />)

    expect(document.getElementById('peek')).toHaveStyle({ height: '120px' })
    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))
    expect(onOpen).toHaveBeenCalled()
  })

  it('opens to full height and hides the expand button', () => {
    render(<Peek open />)

    expect(document.getElementById('peek')).toHaveStyle({ height: '500px' })
    expect(screen.queryByRole('button', { name: 'Expand table' })).not.toBeInTheDocument()
  })
})
