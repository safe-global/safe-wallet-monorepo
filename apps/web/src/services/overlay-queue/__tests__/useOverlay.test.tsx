import { useState } from 'react'
import { fireEvent, render, screen } from '@/tests/test-utils'
import type { OverlayKind } from '../kinds'
import { _resetOverlayQueue } from '../store'
import { useOverlay } from '../useOverlay'

const Overlay = ({ name, kind, onShown }: { name: string; kind: OverlayKind; onShown?: () => void }) => {
  const [isDue, setIsDue] = useState(true)
  const isShown = useOverlay({ kind, isDue, onShown })

  if (!isShown) return null

  return (
    <div role="dialog" aria-label={name}>
      <button onClick={() => setIsDue(false)}>Close {name}</button>
    </div>
  )
}

describe('useOverlay', () => {
  beforeEach(() => _resetOverlayQueue())

  it('shows only the more important of two overlays that are due together, then the other once it closes', () => {
    render(
      <>
        <Overlay name="Tour" kind="guide" />
        <Overlay name="Checkout" kind="confirmation" />
      </>,
    )

    expect(screen.getByRole('dialog', { name: 'Checkout' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Tour' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close Checkout' }))

    expect(screen.getByRole('dialog', { name: 'Tour' })).toBeInTheDocument()
  })

  it('keeps a shown overlay on screen when a more important one becomes due later', () => {
    const { rerender } = render(<Overlay name="Tour" kind="guide" />)

    rerender(
      <>
        <Overlay name="Tour" kind="guide" />
        <Overlay name="Checkout" kind="confirmation" />
      </>,
    )

    expect(screen.getByRole('dialog', { name: 'Tour' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Checkout' })).not.toBeInTheDocument()
  })

  it('gives the screen to the next overlay when the shown one unmounts', () => {
    const { rerender } = render(
      <>
        <Overlay name="Checkout" kind="confirmation" />
        <Overlay name="Tour" kind="guide" />
      </>,
    )

    rerender(<Overlay name="Tour" kind="guide" />)

    expect(screen.getByRole('dialog', { name: 'Tour' })).toBeInTheDocument()
  })

  it('reports each overlay as shown only once it gets the screen', () => {
    const onTourShown = jest.fn()
    render(
      <>
        <Overlay name="Tour" kind="guide" onShown={onTourShown} />
        <Overlay name="Checkout" kind="confirmation" />
      </>,
    )
    expect(onTourShown).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close Checkout' }))

    expect(onTourShown).toHaveBeenCalledTimes(1)
  })

  it('queues two mounts of the same component separately', () => {
    render(
      <>
        <Overlay name="First" kind="reminder" />
        <Overlay name="Second" kind="reminder" />
      </>,
    )

    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Close First' }))
    expect(screen.getByRole('dialog', { name: 'Second' })).toBeInTheDocument()
  })
})
