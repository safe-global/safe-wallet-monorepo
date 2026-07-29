import { LG_UP_QUERY, MD_DOWN_QUERY, SM_DOWN_QUERY } from './useMediaQuery'

/**
 * These queries exist to preserve the MUI breakpoints the app was designed against. The shadcn
 * migration swapped several components onto `useIsMobile` (shadcn's stock hook at 768px), which
 * moved their layout switch 168px from where MUI's `sm` had it — so the exact values matter and are
 * pinned here rather than left to be re-derived.
 *
 * MUI defaults: xs 0, sm 600, md 900, lg 1200, xl 1536. `down(k)` is `max-width: k - 0.05px`,
 * `up(k)` is `min-width: k`.
 */
describe('media query constants', () => {
  it('matches MUI breakpoints.down("sm")', () => {
    expect(SM_DOWN_QUERY).toBe('(max-width:599.95px)')
  })

  it('matches MUI breakpoints.down("md")', () => {
    expect(MD_DOWN_QUERY).toBe('(max-width:899.95px)')
  })

  it('matches MUI breakpoints.up("lg")', () => {
    expect(LG_UP_QUERY).toBe('(min-width:1200px)')
  })

  it("does not use shadcn's 768px mobile breakpoint for the sm tier", () => {
    // Guards the specific regression: `useIsMobile` (768px) standing in for MUI's `sm` (600px).
    expect(SM_DOWN_QUERY).not.toContain('767')
    expect(SM_DOWN_QUERY).not.toContain('768')
  })
})
