import { cn } from '@/utils/cn'
import { largeFormFieldSurfaceClassName } from './formFieldStyles'

// These constants are merged over a primitive's own classes with tailwind-merge, so anything in the
// same conflict group replaces the primitive's version instead of adding to it. Focus treatment is
// the primitive's to own: assert the merge leaves SelectTrigger's focus ring intact rather than
// swapping in a 1px ring that is invisible against the dark-mode border.
describe('largeFormFieldSurfaceClassName', () => {
  const SELECT_TRIGGER_FOCUS = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

  it('does not override the focus ring of the primitive it is merged onto', () => {
    const merged = cn(SELECT_TRIGGER_FOCUS, largeFormFieldSurfaceClassName).split(' ')

    expect(merged.filter((className) => className.startsWith('focus-visible:'))).toEqual(
      SELECT_TRIGGER_FOCUS.split(' '),
    )
  })

  it('still applies the 66px field surface', () => {
    const merged = cn('min-h-9 bg-input px-3', largeFormFieldSurfaceClassName).split(' ')

    expect(merged).toContain('min-h-[66px]')
    expect(merged).toContain('bg-card')
    expect(merged).not.toContain('min-h-9')
    expect(merged).not.toContain('bg-input')
  })
})
