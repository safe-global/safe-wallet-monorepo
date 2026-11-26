import { _resetOverlayQueue, acknowledge, clearDue, getShown, pickShown, setDue } from '../store'
import type { OverlayKind } from '../kinds'

const dueOverlays = (...overlays: [string, OverlayKind][]) =>
  new Map(overlays.map(([key, kind], arrival) => [key, { kind, arrival }]))

describe('pickShown', () => {
  it('shows nothing while no overlay is due', () => {
    expect(pickShown(new Map(), null)).toBeNull()
  })

  it('shows the more important kind, whatever arrived first', () => {
    expect(pickShown(dueOverlays(['tour', 'guide'], ['checkout', 'confirmation']), null)).toBe('checkout')
  })

  it('shows the earlier arrival between two overlays of the same kind', () => {
    expect(pickShown(dueOverlays(['first', 'reminder'], ['second', 'reminder']), null)).toBe('first')
  })

  it('keeps the acknowledged overlay while it stays due, even when a more important kind is due', () => {
    expect(pickShown(dueOverlays(['tour', 'guide'], ['checkout', 'confirmation']), 'tour')).toBe('tour')
  })

  it('moves on once the acknowledged overlay is no longer due', () => {
    expect(pickShown(dueOverlays(['checkout', 'confirmation']), 'tour')).toBe('checkout')
  })
})

describe('overlay queue', () => {
  beforeEach(() => _resetOverlayQueue())

  it('shows the more important kind when both became due before either was acknowledged', () => {
    setDue('tour', 'guide')
    setDue('checkout', 'confirmation')

    expect(getShown()).toBe('checkout')
  })

  it('keeps an acknowledged overlay on screen until it closes, then shows the next one', () => {
    setDue('tour', 'guide')
    acknowledge('tour')
    setDue('checkout', 'confirmation')
    expect(getShown()).toBe('tour')

    clearDue('tour')

    expect(getShown()).toBe('checkout')
  })

  it('ignores an acknowledgement from an overlay that does not have the screen', () => {
    setDue('tour', 'guide')
    setDue('checkout', 'confirmation')
    acknowledge('tour')

    expect(getShown()).toBe('checkout')
  })

  it('keeps the first arrival when an overlay reports that it is due again', () => {
    setDue('first', 'reminder')
    setDue('second', 'reminder')
    setDue('first', 'reminder')

    expect(getShown()).toBe('first')
  })
})
