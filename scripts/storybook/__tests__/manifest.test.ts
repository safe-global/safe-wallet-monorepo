import { diffManifests, formatDiff, hashImage } from '../manifest'

describe('hashImage', () => {
  it('gives identical bytes the same hash and different bytes a different one', () => {
    expect(hashImage(Buffer.from('a'))).toBe(hashImage(Buffer.from('a')))
    expect(hashImage(Buffer.from('a'))).not.toBe(hashImage(Buffer.from('b')))
  })
})

describe('diffManifests', () => {
  it('reports nothing when every image is identical', () => {
    expect(diffManifests({ 'a.png': '1' }, { 'a.png': '1' })).toEqual({ changed: [], added: [], removed: [] })
  })

  it('separates changed, added and removed images, each sorted by name', () => {
    const base = { 'b.png': '1', 'a.png': '1', 'gone.png': '1', 'same.png': '1' }
    const head = { 'b.png': '2', 'a.png': '2', 'new.png': '1', 'same.png': '1' }

    expect(diffManifests(base, head)).toEqual({
      changed: ['a.png', 'b.png'],
      added: ['new.png'],
      removed: ['gone.png'],
    })
  })

  it('treats every image as added when there is no baseline', () => {
    expect(diffManifests({}, { 'a.png': '1' })).toEqual({ changed: [], added: ['a.png'], removed: [] })
  })
})

describe('formatDiff', () => {
  it('starts with a count line that covers changed, added and removed images', () => {
    const text = formatDiff({ changed: ['a.png'], added: ['b.png'], removed: ['c.png'] }, 640)

    expect(text.split('\n')[0]).toBe('sheets changed: 3 of 640')
    expect(text).toContain('### Changed (1)\n\n- `a.png`')
    expect(text).toContain('### Added (1)\n\n- `b.png`')
    expect(text).toContain('### Removed (1)\n\n- `c.png`')
  })

  it('prints only the count line when nothing changed', () => {
    expect(formatDiff({ changed: [], added: [], removed: [] }, 640)).toBe('sheets changed: 0 of 640\n')
  })
})
