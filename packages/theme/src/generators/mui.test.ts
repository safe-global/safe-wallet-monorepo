import type { Theme } from '@mui/material/styles'
import { generateMuiTheme } from './mui'

type PaperStyleFn = (props: { theme: Theme }) => Record<string, unknown>

describe('generateMuiTheme', () => {
  const theme = generateMuiTheme('light')

  it('should keep menus scrollable despite the popover overflow override', () => {
    // MuiPopover paper sets `overflow: visible` (for popovers with content
    // poking outside the paper). Menus inherit that override, so MuiMenu must
    // restore `overflowY: auto` or long menus (e.g. the currency selector)
    // overflow the viewport without a scrollbar.
    const popoverPaper = (theme.components?.MuiPopover?.styleOverrides?.paper as PaperStyleFn)({ theme })
    expect(popoverPaper.overflow).toBe('visible')

    const menuPaper = (theme.components?.MuiMenu?.styleOverrides?.paper as PaperStyleFn)({ theme })
    expect(menuPaper.overflowY).toBe('auto')
  })
})
