import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The three controls in the SpaceSafeBar pill — safe selector, nested safes, network — must read as
 * one row of equal-height chips. Only the selector sets a height; the chips are `self-stretch`, so
 * they match it for free while they share a flex line and collapse to their icon height the moment
 * the selector wraps onto its own row (every layout below `sm`). Their `min-h-*` floor is what
 * stops that, which makes "the floor equals the selector's height" the actual contract.
 *
 * jsdom loads no CSS, so asserting `min-h-10` on a rendered chip could not fail for the right
 * reason. Reading the number out of both sources can: bump the selector to `h-12` and leave the
 * chips behind and this goes red, whatever the utilities are renamed to.
 */
// Comments go first: the ones explaining these very utilities quote them, which would otherwise
// register as class lists that carry no height.
const read = (...segments: string[]) =>
  readFileSync(join(__dirname, ...segments), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')

const SELECTOR_SOURCE = read('..', '..', '..', 'features', 'spaces', 'components', 'SafeSelectorDropdown', 'index.tsx')
const CHIP_SOURCES = {
  'nested safes': read('SpaceNestedSafesButton.tsx'),
  network: read('SpaceChainSelector.tsx'),
}

// Class lists are matched by an anchor utility unique to the safe-bar controls, so the heights of
// the decorative skeletons inside them are never mistaken for a control height.
const classListsContaining = (source: string, anchor: string): string[] =>
  // Every string literal in the file, so both `className="…"` and the `cn('…')` argument lists are
  // covered; the anchor filter drops everything that is not a class list.
  [...source.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g)]
    .map(([, doubleQuoted, singleQuoted, templated]) => doubleQuoted ?? singleQuoted ?? templated ?? '')
    .filter((classList) => classList.includes(anchor))

const heightsIn = (classLists: string[], prefix: '' | 'min-'): number[] =>
  classLists.flatMap((classList) =>
    [...classList.matchAll(new RegExp(`(?:^|\\s)${prefix}h-(\\d+)(?=\\s|$)`, 'g'))].map(([, value]) => Number(value)),
  )

// `max-w-[515px]` is the selector chip's own width cap — unique to it, and present on both the real
// wrapper and its loading skeleton; `self-stretch` marks a chip that borrows its height from the
// flex line.
const selectorHeights = heightsIn(classListsContaining(SELECTOR_SOURCE, 'max-w-[515px]'), '')

describe('SpaceSafeBar control height', () => {
  it('sets one consistent height across the safe selector and its loading state', () => {
    expect(selectorHeights.length).toBeGreaterThan(1)
    expect(new Set(selectorHeights).size).toBe(1)
  })

  it.each(Object.entries(CHIP_SOURCES))('floors every stretching %s wrapper at the selector height', (_, source) => {
    const wrappers = classListsContaining(source, 'self-stretch')

    // A `self-stretch` wrapper with no floor is the exact shape of the collapse bug.
    expect(wrappers.length).toBeGreaterThan(0)
    expect(heightsIn(wrappers, 'min-')).toEqual(wrappers.map(() => selectorHeights[0]))
  })
})
